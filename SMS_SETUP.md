# SMS Integration — How It Works, What's Done, What's Next

SMS alerts for ticket/maintenance events, delivered through an **Ethio Telecom
gateway** (direct enterprise API) or an **Ethio Telecom partner/aggregator**.
SMS now runs alongside the existing in-app, email, and Telegram channels.

---

## 1. How SMS works (end-to-end flow)

```
Ticket event happens (submit / approve / assign / reject / complete / reopen)
        │
        ▼
NotificationService  ── creates the in-app DB notification (synchronous, unchanged)
        │
        └── NotificationService::sms(userId, "EEC IT: …")
                │
                ▼
        SendSmsNotification job  ── pushed onto the database queue
                │                   (request is never blocked by the SMS gateway)
                ▼
        queue worker: php artisan queue:work
                │
                ├── looks up the user → profiles.phone
                │     • no phone number? → skipped, logged, no error
                │
                ▼
        SmsService::send(phone, message)
                │
                ├── normalizes the number:  0912345678 → 251912345678
                │   (accepts 09…, 9…, +251…, 251…; Ethio Telecom 09x + Safaricom 07x)
                │
                ├── SMS_DRIVER=log  (default in dev)
                │       └── writes the message to storage/logs/laravel.log — nothing sent, zero cost
                │
                └── SMS_DRIVER=api  (live)
                        └── POST JSON to SMS_API_URL
                            { "to": "251912345678", "message": "…", "sender_id": "EEC" }
                            authenticated per SMS_AUTH_MODE (bearer | basic | header | none)
```

**Retry behavior** (handled by the queue job, `tries = 3`, `backoff = 30s`):

| Failure | Behavior |
|---|---|
| Connection error / gateway 5xx | Job **retries** up to 3 times, then logs a permanent failure |
| Gateway 4xx (bad key, bad number, unapproved sender ID) | Logged as an error, **no retry** (retrying can't fix it) |
| User has no phone number | Skipped silently |
| Dev mode (`SMS_DRIVER=log`) | Always "succeeds", writes to the log |

**Message sizing:** one SMS = 160 characters (GSM-7). Longer messages are split
into multiple segments and billed per segment — ticket messages are kept short
for this reason.

---

## 2. What's done ✅

All backend code is complete, tested (8/8 tests passing), and ready to use in
dev mode as-is.

| # | Item | Where |
|---|---|---|
| 1 | `SmsService` — HTTP client, auth modes, configurable JSON field names, Ethiopian number normalization, error classification (retry vs. no-retry) | `asset-task-sync-backend/app/Services/SmsService.php` |
| 2 | `SendSmsNotification` — queued job (3 retries, 30s backoff), resolves the user's `profiles.phone`, skips users without a number | `asset-task-sync-backend/app/Jobs/SendSmsNotification.php` |
| 3 | `NotificationService::sms()` — safe dispatcher used by every ticket event | `asset-task-sync-backend/app/Services/NotificationService.php` |
| 4 | SMS wired into **all 7 ticket events** (see table below) | `NotificationService` + `MaintenanceTicketController.php` |
| 5 | SMS config block (driver, URL, auth, field names, sender ID) | `asset-task-sync-backend/config/services.php` |
| 6 | Env template with every `SMS_*` variable | `asset-task-sync-backend/.env.example` |
| 7 | Test command: `php artisan test:sms 0912345678 "Hello"` | `app/Console/Commands/TestSms.php` |
| 8 | Unit tests for number normalization (6 tests) | `tests/Unit/SmsServiceTest.php` |
| 9 | Phone numbers already collected at signup + admin Users page → `profiles.phone` (no frontend changes needed) | Frontend `Auth.tsx`, `Users.tsx` |
| 10 | This documentation | `SMS_SETUP.md` (repo root) |

### Events and recipients

| Event | Who gets the SMS |
|---|---|
| Ticket submitted | Assigned manager + all super admins |
| Ticket approved | Requester |
| Ticket rejected | Requester (includes the rejection reason) |
| Ticket assigned | Technician + requester |
| Completed (pending review) | Manager + super admins + requester |
| Completion approved | Technician |
| Reopened | Manager + super admins + requester |

> Deduplication: users who would receive two identical messages for the same
> event (e.g. they are both the manager and a super admin) are only notified
> once per event.

---

## 3. What you need to do 📋

### Step 1 — Get SMS API access (the only manual/external step)

Choose one:

- **Option A — Ethio Telecom directly (enterprise SMS API)**
  Apply through Ethio Telecom Enterprise/Wholesale as a business, register an
  official **sender ID** (e.g. `EEC`), sign a contract, and receive the API
  endpoint + credentials + pricing. Best for volume and branded sender IDs;
  onboarding takes time.

- **Option B — Ethio Telecom partner/aggregator (fastest)**
  Licensed aggregators on the Ethio Telecom network with self-service sign-up
  and an API key within minutes: **SMSEthiopia**, **Alpha Message**,
  **eSMS Africa**, **send.et**. Most give free test credit / a sandbox.

Either way you get the same thing: a URL, credentials, and a JSON field spec —
all configurable below **without code changes**.

### Step 2 — Configure `.env`

In `asset-task-sync-backend/.env`:

```env
SMS_DRIVER=api                      # switch from log → api (live sending)
SMS_API_URL=https://your-gateway.example/api/sms/send
SMS_AUTH_MODE=bearer                # bearer | basic | header | none
SMS_API_KEY=your-key                # bearer / header mode
SMS_USERNAME=                        # basic mode only
SMS_PASSWORD=                        # basic mode only
SMS_AUTH_HEADER=KEY                  # header mode: custom header name (default KEY)
SMS_SENDER_ID=EEC                    # your approved sender ID (optional)

# JSON body field names — copy from your provider's API docs
SMS_TO_FIELD=to
SMS_MESSAGE_FIELD=message
SMS_SENDER_FIELD=sender_id
```

Provider cheat-sheet:

| Provider | URL | Auth | Fields / Params |
|---|---|---|---|
| **Milkotech / EEC SMS Gateway** | `http://msgg.milkotech.et/api/send/sms` | `body` (`SMS_API_KEY=...`) | `SMS_DEVICE_ID=...`, `SMS_MODE=devices`, `SMS_SIM=1`, `SMS_CONTENT_TYPE=form`, `SMS_TO_FIELD=phone`, `SMS_MESSAGE_FIELD=message` |
| SMSEthiopia | `https://smsethiopia.com/api/sms/send` | `header` + `SMS_AUTH_HEADER=KEY` | `SMS_TO_FIELD=msisdn`, `SMS_MESSAGE_FIELD=text` |
| Generic bearer (send.et, eSMS Africa…) | provider's `/v1/...` URL | `bearer` | `to` / `message` (or `body`) |
| Ethio Telecom direct (if docs use Basic) | provider's URL | `basic` (username/password) | per their docs |

### Step 3 — Test

```bash
cd asset-task-sync-backend

# 1. Dev mode (SMS_DRIVER=log): confirm it runs — message appears in storage/logs/laravel.log
php artisan test:sms 0912345678 "Test from EEC IT"

# 2. Live mode: set SMS_DRIVER=api + SMS_API_URL (+ auth) in .env, then:
php artisan test:sms 0912345678 "Test from EEC IT"
```

### Step 4 — Make sure the queue worker is running

SMS is sent by a queued job — **nothing is sent if no worker runs**. In dev:

```bash
php artisan queue:work
```

For production (cPanel/hosting), set up a persistent worker or cron — see
`asset-task-sync-backend/QUEUE_SETUP.md`.

### Step 5 — Verify phone numbers exist

SMS only goes out where `profiles.phone` is filled in (set at signup or by an
admin on the **Users** page). Numbers with any format (`09…`, `+251…`, spaces)
work — they're normalized automatically.

---

## 4. Configuration reference

| Env variable | Default | Meaning |
|---|---|---|
| `SMS_DRIVER` | `log` | `log` = write to log only (dev, free); `api` = real sending |
| `SMS_API_URL` | — | Gateway endpoint (required for `api`) |
| `SMS_AUTH_MODE` | `bearer` | `bearer` \| `basic` \| `header` \| `none` |
| `SMS_API_KEY` | — | Key for `bearer`/`header` modes |
| `SMS_USERNAME` / `SMS_PASSWORD` | — | For `basic` mode |
| `SMS_AUTH_HEADER` | `KEY` | Custom header name for `header` mode |
| `SMS_SENDER_ID` | — | Approved sender ID (omitted if empty) |
| `SMS_TO_FIELD` | `to` | JSON key for the recipient number |
| `SMS_MESSAGE_FIELD` | `message` | JSON key for the message text |
| `SMS_SENDER_FIELD` | `sender_id` | JSON key for the sender ID |

---

## 5. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Nothing in `laravel.log`, no SMS | `SMS_DRIVER=log` (dev default) — expected, or queue worker not running |
| `SMS rejected by gateway (401/403)` | Wrong API key/header name, or sender ID not approved yet |
| `SMS rejected by gateway (400)` | Field names don't match the provider's docs — adjust `SMS_TO_FIELD` / `SMS_MESSAGE_FIELD` |
| `SMS gateway unreachable` | Wrong `SMS_API_URL`, or the server can't reach it (firewall/outbound HTTPS) |
| Job retries then `SendSmsNotification failed` | Gateway 5xx or network flapping — check gateway status page |
| "no phone number on profile" in logs | Recipient's `profiles.phone` is empty — fill it in on the Users page |
| Message split into 2+ segments | Over 160 characters — shorten the message (billed per segment) |

---

## 6. Optional next steps (not implemented)

- [ ] **Per-user SMS opt-out** — a `sms_notifications` toggle on the profile so
      users can mute SMS while keeping in-app/email.
- [ ] **Delivery reports (DLR)** — if your provider supports webhooks, store
      delivery status per message.
- [ ] **OTP / login verification codes** — `SmsService` can be reused as-is;
      needs a `verify_codes` table + endpoint.
- [ ] **Scheduled-maintenance reminders** — send SMS the day before a scheduled
      maintenance date (could hook into `CheckMaintenanceSchedules`).
