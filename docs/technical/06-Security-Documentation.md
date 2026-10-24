# 06 — Security Documentation

**Document:** Technical Documentation  
**System:** EEC IT Asset & Ticket Management System  
**Version:** 1.0  
**Date:** October 2026  
**Audience:** Architects, backend engineers, administrators

---

## Table of Contents

1. [Security Objectives](#1-security-objectives)
2. [Authentication](#2-authentication)
3. [Authorization (RBAC)](#3-authorization-rbac)
4. [Password and Token Handling](#4-password-and-token-handling)
5. [API Surface and CORS](#5-api-surface-and-cors)
6. [Data Privacy](#6-data-privacy)
7. [Integrations and Secrets](#7-integrations-and-secrets)
8. [Audit and Logging](#8-audit-and-logging)
9. [Operational Hardening](#9-operational-hardening)
10. [Known Residual Risks](#10-known-residual-risks)

---

## 1. Security Objectives

The implemented controls are designed to:

- Prevent unauthenticated access to the API except for registration, login, and the Telegram webhook.
- Stop unapproved (`pending` / `rejected`) users from obtaining tokens.
- Enforce role and permission checks on assets, tickets, users, and reports.
- Keep passwords, personal access tokens, and third-party API keys out of JSON responses.
- Restrict browser origins to the configured frontend URL.
- Record administrative and ticket actions in the activity log.

Non-functional requirements from the SRS:

| ID | Requirement |
|----|-------------|
| NFR-SEC-01 | All API endpoints except `/register`, `/login`, and the Telegram webhook require a valid Bearer token |
| NFR-SEC-02 | Passwords hashed with bcrypt (12 rounds) |
| NFR-SEC-03 | User status enforced at login |
| NFR-SEC-04 | Policies and Gate checks on sensitive operations |
| NFR-SEC-05 | CORS limited to `FRONTEND_URL` |
| NFR-SEC-06 | No passwords, tokens, or API keys in API responses |
| NFR-SEC-07 | Admin managers cannot create Admin or Super Admin accounts |

---

## 2. Authentication

Authentication uses **Laravel Sanctum personal access tokens**. There is no server-side session for the SPA.

```
User submits email/password
        → POST /api/login
        → credentials valid?
              no  → 422 invalid credentials
              yes → user.status?
                      pending  → 422 awaiting approval
                      rejected → 422 registration not approved
                      active   → create Sanctum token, return { user, token }
```

The React client stores the token (typically `localStorage`) and sends:

```
Authorization: Bearer {token}
```

on every protected request. `auth:sanctum` middleware rejects missing or invalid tokens with **401**.

**Logout** (`POST /api/logout`) deletes the current token. Tokens do not expire by default; prune unused tokens in production (`php artisan sanctum:prune-expired`).

**Registration** (`POST /api/register`) creates:

- `users` row with `status = pending`
- `profiles` row
- `requester` role

Admins are notified in-app; Super Admins can also receive email. Optional delayed auto-approval is controlled by `REGISTRATION_AUTO_APPROVE_AFTER_MINUTES`.

---

## 3. Authorization (RBAC)

Three layers:

1. **Route middleware** — `auth:sanctum` on all routes except the three public endpoints.
2. **Controller role checks** — for example `$user->hasAnyRole(['admin', 'super_admin'])`.
3. **Policies / Gates** — `AssetPolicy`, `MaintenanceTicketPolicy`, plus `hasPermissionTo(...)` for `view assets`, `manage assets`, `view tickets`, `manage tickets`, `manage users`.

### 3.1 Permission matrix

| Capability | Requester | Technician | Admin | Super Admin |
|------------|-----------|------------|-------|-------------|
| View assets | Yes | Yes | Yes | Yes |
| Manage assets | No | No | Yes | Yes |
| View tickets (scoped) | Own | Assigned | Department | All |
| Approve / reject / assign | No | No | Yes | Yes |
| Update progress / complete | No | Yes (assigned) | Yes | Yes |
| Manage users | No | No | Limited | Yes |
| Create Admin / Super Admin | No | No | No | Yes |

### 3.2 Ticket visibility

- **Super Admin:** all tickets  
- **Admin:** tickets where they are `assigned_manager_id` or the category matches their profile  
- **Technician:** `assigned_technician_id` = their profile  
- **Requester:** `requester_id` = their profile  

### 3.3 Domain isolation

When assigning technicians:

- SAP tickets → SAP technicians only  
- IT Support tickets → not SAP or facility technicians  
- General tickets → not SAP technicians  

Admin managers may create **technicians in their own support domain only**.

---

## 4. Password and Token Handling

| Item | Implementation |
|------|----------------|
| Password hash | bcrypt, `BCRYPT_ROUNDS=12` in production |
| Model | `User::password` uses Laravel `hashed` cast |
| API hiding | `password` is in `$hidden`; never returned |
| Sanctum tokens | Stored hashed in `personal_access_tokens`; plaintext shown **once** at login |
| Password change | `POST /api/user/update-password` requires current password, min 8 characters |

Seeded demo accounts use `password`. Change them before any shared or production use.

---

## 5. API Surface and CORS

**Public (no Bearer token)**

- `POST /api/register`
- `POST /api/login`
- `POST /api/telegram/webhook`

Everything else is inside `Route::middleware('auth:sanctum')`.

CORS (`config/cors.php`):

- Allowed origins: `FRONTEND_URL`
- Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Headers: Content-Type, Authorization, X-Requested-With
- Credentials supported

Production must use HTTPS so tokens are not sent in clear text. Set `APP_DEBUG=false` and a unique `APP_KEY`.

File uploads (ticket attachments): max 5 files, 5 MB each, types jpg, jpeg, png, gif, webp, pdf.

---

## 6. Data Privacy

- Technician ticket payloads hide `feedback_comment` (`makeHidden`); ratings remain visible.
- Profile and user lists are role-filtered in controllers.
- Activity logs record who changed what; treat them as sensitive operational data.
- Do not log raw passwords, Sanctum tokens, Graph client secrets, SMS keys, or Telegram bot tokens.

---

## 7. Integrations and Secrets

Store secrets only in `.env` (never in git). Typical keys:

| Variable | Purpose |
|----------|---------|
| `APP_KEY` | Laravel encryption |
| `DB_*` | Database credentials |
| `FRONTEND_URL` | CORS allowlist |
| `TELEGRAM_BOT_TOKEN` | Bot API |
| SMS gateway keys | Outbound SMS |
| Azure / Microsoft Graph client id, secret, tenant | Outbound mail |

**Telegram webhook** is unauthenticated by design so Telegram can POST updates. Protect it by:

- Using a high-entropy bot token
- Restricting the webhook URL to HTTPS
- Validating Telegram’s expected payload shape in `TelegramWebhookController`
- Not exposing extra admin actions on that route

SMS, Telegram, and Graph calls run as **queued jobs**. Failures are logged and must not fail the user-facing HTTP request.

---

## 8. Audit and Logging

- Application errors: `storage/logs/laravel.log` (prefer `LOG_CHANNEL=daily` in production).
- User and ticket actions: `activity_logs` table via the activity logger service.
- Failed background work: `failed_jobs`.

Review activity logs for unusual role changes and failed login patterns. Restrict the Activity Logs UI to Admins and Super Admins.

---

## 9. Operational Hardening

1. Rotate default seeded passwords immediately.  
2. Issue TLS certificates (cPanel AutoSSL / Let’s Encrypt).  
3. Keep `FRONTEND_URL` aligned with the real SPA origin.  
4. Run `composer audit` and `npm audit` on a schedule.  
5. Restrict cPanel / SSH access; do not enable directory listing on `storage/`.  
6. Serve attachments only through the public storage symlink, not by exposing the whole `storage/app` tree.  
7. Prune expired Sanctum tokens.  
8. Rotate Graph, Telegram, and SMS credentials at least quarterly.  
9. Backup MySQL and `storage/app/public` off-host.  
10. Set `APP_ENV=production` and disable debug.

---

## 10. Known Residual Risks

These are product facts, not hypothetical attacks:

- SPA tokens in `localStorage` are exposed to XSS if a script injection exists in the frontend. Keep dependencies updated and avoid `dangerouslySetInnerHTML` with untrusted content.
- Sanctum tokens do not expire unless pruned or revoked on logout.
- The Telegram webhook has no Sanctum auth; compromise of the bot token is equivalent to webhook access.
- Automated security test coverage is still limited (see [07-Testing-Documentation.md](07-Testing-Documentation.md)). Privilege checks should be regression-tested before major releases.
- Shared hosting means PHP, MySQL, and file storage share a tenant environment; rely on cPanel user isolation and strong account passwords.
