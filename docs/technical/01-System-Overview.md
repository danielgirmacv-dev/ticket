# 01 — System Overview

**Document:** Technical Documentation  
**System:** EEC IT Asset & Ticket Management System  
**Version:** 1.0  
**Date:** October 2026  
**Status:** Based on implemented codebase

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Product Scope](#2-product-scope)
3. [Technology Stack](#3-technology-stack)
4. [Users and Roles](#4-users-and-roles)
5. [Core Capabilities](#5-core-capabilities)
6. [Ticket Lifecycle](#6-ticket-lifecycle)
7. [Integrations](#7-integrations)
8. [Repository Layout](#8-repository-layout)
9. [Related Documents](#9-related-documents)

---

## 1. Purpose

The **EEC IT Asset & Ticket Management System** is a web application for Ethiopian Electric Construction (EEC) IT operations. It tracks physical IT assets, runs a multi-stage maintenance and support ticket workflow, and notifies staff through in-app messages, SMS, Telegram, and email.

This overview is the entry point for the technical documentation suite. Detailed architecture, database, API, deployment, security, testing, and operations material is in the remaining files in `docs/technical/`.

---

## 2. Product Scope

The system is a **decoupled two-tier application**:

| Component | Role |
|-----------|------|
| **Frontend (SPA)** | React 18 + TypeScript UI. Users log in, submit tickets, manage assets, and view reports. |
| **Backend (REST API)** | Laravel 12 JSON API. Authentication, business rules, database, and external notifications. |

Typical production layout is two subdomains (for example `app.domain.com` and `api.domain.com`) on cPanel shared hosting.

**In scope**

- User registration with admin approval
- Role-based access (Requester, Technician, Admin, Super Admin)
- IT asset registry with CSV import
- Maintenance ticket workflow (10 statuses)
- Smart routing of tickets to department managers
- Preventive maintenance schedules
- Notifications (in-app, SMS, Telegram, Microsoft Graph email)
- FAQ knowledge base and keyword chatbot
- Reports and CSV export
- Activity audit logging

**Out of scope (current product)**

- Native mobile apps
- Redis / dedicated queue servers (queues use the database so shared hosting works)
- External generative AI for the chatbot

---

## 3. Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS, shadcn/ui, Axios |
| Backend | PHP 8.2+, Laravel 12, Laravel Sanctum, Spatie Permission |
| Database | SQLite (development), MySQL 8.0+ (production) |
| Queue / cache / session | Laravel database drivers |
| Web server | Apache with `mod_rewrite` |
| Email | Microsoft Graph API |
| SMS | Configurable HTTP gateway (for example AfroMessage / Ethio Telecom) |
| Chat | Telegram Bot API |

---

## 4. Users and Roles

Access control uses **Spatie Laravel Permission**.

| Role | Primary job |
|------|-------------|
| **Requester** | Default after approval. Submit and track own tickets (max 3 active). Review completions and leave ratings. |
| **Technician** | Work assigned tickets: start, log progress, complete. See ratings, not private feedback comments. |
| **Admin (Manager)** | Approve/reject tickets in their support category, assign technicians, manage assets and users in domain. Cannot create other Admins or Super Admins. |
| **Super Admin** | Full access, including user approval and creating any role. Sees all tickets. |

Support categories used for routing: `it_support`, `sap`, `general`.

---

## 5. Core Capabilities

### 5.1 Authentication

- Self-registration creates a user with `pending` status.
- Login is blocked until an Admin or Super Admin approves the account.
- Sessions are **Sanctum personal access tokens** (Bearer header). Logout revokes the current token.
- Optional auto-approval after N minutes via `REGISTRATION_AUTO_APPROVE_AFTER_MINUTES`.

### 5.2 Assets

Assets represent computers, printers, servers, network devices, and other equipment. Fields include serial number, purchase/warranty dates, location, status (`active`, `maintenance`, `retired`, `disposed`), assigned user, and notes. Admins can import from CSV.

### 5.3 Tickets

Any authenticated user can submit a ticket (title, type, support category, priority, scheduled date, optional asset and attachments). The API routes the ticket to the matching department manager. Managers approve or reject, assign technicians (with domain isolation), and review completion. Requesters can reopen work and submit 1–5 star feedback.

### 5.4 Preventive maintenance

Admins define schedules per asset (daily, weekly, monthly, quarterly, yearly). The Artisan command `maintenance:check-schedules` generates tickets when due. It is **not** enabled on the scheduler by default and must be configured in production.

### 5.5 Help

Published FAQ articles power the Help Center and a **keyword chatbot** (`POST /api/chat/assist`). No external AI is used.

---

## 6. Ticket Lifecycle

```
submitted → approved → assigned → in_progress → completed_pending_review → completed
         ↘ rejected                                                       ↗
                                              ← reopened ←
```

| Status | Meaning |
|--------|---------|
| `submitted` | Awaiting manager decision |
| `approved` | Accepted; awaiting technician |
| `rejected` | Declined with reason |
| `assigned` | Technician selected |
| `in_progress` | Work started |
| `completed_pending_review` | Technician finished; requester/manager reviews |
| `completed` | Accepted |
| `reopened` | Completion rejected; work continues |
| `cancelled` | Cancelled by requester (when allowed) |

---

## 7. Integrations

| Channel | When used | Delivery |
|---------|-----------|----------|
| In-app notifications | All major ticket and registration events | Synchronous database writes |
| SMS | Key ticket events, if phone on profile | Queued HTTP job |
| Telegram | Approval, assignment, ticket events if account linked | Queued Bot API job |
| Email | New registration (Super Admins), ticket approval | Queued Microsoft Graph job |

Telegram accounts are linked with a 15-minute deep-link token. The webhook `POST /api/telegram/webhook` is public (no Sanctum token).

---

## 8. Repository Layout

```
asset-task-sync-backend/   Laravel API
asset-task-sync-main/      React SPA (Vite)
docs/                      Documentation (this suite)
```

Default seeded logins (change immediately in any real environment):

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@example.com` | `password` |
| Admin | `admin@example.com` | `password` |
| Technician | `technician@example.com` | `password` |
| Requester | `requester@example.com` | `password` |

---

## 9. Related Documents

| File | Contents |
|------|----------|
| [02-System-Architecture.md](02-System-Architecture.md) | Tiers, services, data flow |
| [03-Database-Documentation.md](03-Database-Documentation.md) | Schema, ER diagram, migrations |
| [04-API-Documentation.md](04-API-Documentation.md) | REST endpoints |
| [05-Installation-Deployment.md](05-Installation-Deployment.md) | Local and cPanel setup |
| [06-Security-Documentation.md](06-Security-Documentation.md) | Auth, RBAC, secrets, CORS |
| [07-Testing-Documentation.md](07-Testing-Documentation.md) | Test strategy and gaps |
| [08-Maintenance-Troubleshooting.md](08-Maintenance-Troubleshooting.md) | Operations and runbooks |

End-user instructions live in `docs/user-manual/`. Combined Word exports are in `docs/output/`.
