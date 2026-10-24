# Administrator Manual

**Document Title:** Administrator Manual  
**System Name:** EEC IT Asset & Ticket Management System  
**Version:** 1.0  
**Date:** October 2026  
**Audience:** Super Admins and System Administrators

---

## Table of Contents

1. [Administrator Roles Overview](#1-administrator-roles-overview)
2. [First-Time Setup](#2-first-time-setup)
3. [User Management](#3-user-management)
4. [Role and Permission Management](#4-role-and-permission-management)
5. [Asset Management](#5-asset-management)
6. [Ticket Management and Oversight](#6-ticket-management-and-oversight)
7. [Notification System Management](#7-notification-system-management)
8. [Telegram Bot Administration](#8-telegram-bot-administration)
9. [SMS Gateway Administration](#9-sms-gateway-administration)
10. [Email Configuration](#10-email-configuration)
11. [FAQ and Knowledge Base Management](#11-faq-and-knowledge-base-management)
12. [Reports and Data Export](#12-reports-and-data-export)
13. [Activity Log Review](#13-activity-log-review)
14. [Preventive Maintenance Management](#14-preventive-maintenance-management)
15. [System Configuration Reference](#15-system-configuration-reference)

---

## 1. Administrator Roles Overview

The system has two administrative roles:

### 1.1 Admin (Manager)

The **Admin** role functions as a **department manager**. This role:
- Reviews and approves/rejects tickets submitted to their support category
- Assigns technicians to tickets within their domain
- Reviews ticket completions
- Manages assets, locations, departments, FAQs
- Creates technician accounts within their own support domain
- Has restricted visibility — only sees tickets in their department

**Limitation:** Admin managers **cannot** create other Admin or Super Admin accounts.

### 1.2 Super Admin

The **Super Admin** role has **full system authority**:
- All Admin capabilities plus
- Approves pending user registrations from self-registration
- Creates accounts for all roles including other Admins/Super Admins
- Sees **all tickets** across all departments
- Receives oversight notifications for all ticket events
- Changes user roles
- Has no domain restrictions

---

## 2. First-Time Setup

After a fresh deployment, complete these steps in order:

### 2.1 Login with Default Credentials

| Role | Email | Password |
|------|-------|---------|
| Super Admin | `superadmin@example.com` | `password` |
| Admin | `admin@example.com` | `password` |
| Technician | `technician@example.com` | `password` |
| Requester | `requester@example.com` | `password` |

> ⚠️ **Change all default passwords immediately** via Settings → Security.

### 2.2 Configure Support Categories for Admin Accounts

The **most critical first step** for proper ticket routing:

1. Navigate to **Users** → click on each Admin account.
2. Edit their **Profile** and set the **Support Category**:
   - IT department manager → `IT Support`
   - SAP/ERP department manager → `SAP`
   - Facilities/General department manager → `General`
3. Save changes.

Without this configuration, the smart routing system falls back to keyword heuristics which may be less accurate.

### 2.3 Create Locations

1. Go to **Locations** (`/locations`).
2. Add all physical office locations (e.g., "Head Office", "Branch A", "Warehouse").
3. Or import from CSV: `name` column required.

### 2.4 Create Departments

1. Go to **Departments** (`/departments`).
2. Add all organizational departments.
3. Or import from CSV: `name` column required.

### 2.5 Import Assets

1. Go to **Assets** (`/assets`).
2. Click **"Import CSV"**.
3. Upload a CSV file with columns: `name`, `type`, `serial_number`, `purchase_date`, `location`, `status`.
4. Or add assets one by one via **"Add Asset"**.

### 2.6 Create User Accounts

1. Go to **Users** (`/users`).
2. Click **"Add User"** to create accounts for:
   - Department managers (role: `admin`)
   - Technicians (role: `technician`)
   - Initial requesters (role: `requester`)

### 2.7 Seed FAQ Articles

1. Go to **FAQs** (`/faqs`).
2. Create knowledge base articles for common IT questions.
3. **Publish** articles to make them visible to users.
4. Or run `php artisan db:seed --class=FaqSeeder` on the server for sample data.

### 2.8 Configure Notifications (Optional)

See sections 8–10 for Telegram, SMS, and Email configuration.

---

## 3. User Management

### 3.1 Approving Pending Registrations

When users self-register, they appear in the **Users** page with `Pending` status.

1. Go to **Users** → filter by **Status: Pending**.
2. Click on a pending user.
3. Click **"Approve"** to activate the account or **"Reject"** to deny it.

After approval:
- User's status changes to `active`
- User receives in-app notification
- If Telegram is linked, they receive a Telegram message
- User can now log in

### 3.2 Creating New Users (Admin-Created)

Admin-created accounts bypass the pending state and are immediately active.

1. Go to **Users** → **"Add User"**.
2. Fill in:
   - **Name**, **Email**, **Password**
   - **Role** — select appropriate role
   - **Department** — (for technicians)
   - **Support Category** — (critical for managers)
   - **Phone** — for SMS notifications
   - **Location** — physical location
3. Click **"Create User"**.

> **Manager Creation Restriction:** Only Super Admins can create Admin or Super Admin accounts.

### 3.3 Editing User Profiles

1. Find the user in the **Users** list.
2. Click their name to open their profile.
3. Click **"Edit"** to modify:
   - Contact information (phone, email)
   - Department and support category
   - Location assignment
   - Telegram username

### 3.4 Changing User Roles

1. Open a user's profile.
2. Click **"Change Role"** (Super Admin only).
3. Select the new role.
4. Confirm.

> Note: After role changes, the ticket routing cache is automatically cleared.

### 3.5 Deactivating a User

Currently, there is no soft-disable feature. To deactivate a user, you can:
- Change their role to `requester` (reduces their system access)
- Delete their profile (will set FK references to NULL on related tickets)

> ⚠️ **Note:** Direct user deletion is not implemented in the UI. Profile deletion can be done via the API `DELETE /profiles/{id}`. This is a sensitive operation.

---

## 4. Role and Permission Management

### 4.1 Defined Roles

| Role Key | Display Name | Description |
|----------|-------------|-------------|
| `requester` | Requester | Submit and track tickets |
| `technician` | Technician | Resolve assigned tickets |
| `admin` | Manager | Department manager, approve/assign/review |
| `super_admin` | Super Admin | Full system access |

### 4.2 Defined Permissions

| Permission | Granted To |
|-----------|-----------|
| `view assets` | requester, technician, admin, super_admin |
| `manage assets` | admin, super_admin |
| `view tickets` | requester, technician, admin, super_admin |
| `manage tickets` | technician, admin, super_admin |
| `manage users` | admin, super_admin |

### 4.3 Re-Seeding Roles

If roles are accidentally modified or a fresh deployment needs seeding:

```bash
php artisan db:seed --class=RolesAndPermissionsSeeder
```

This command is idempotent — it uses `firstOrCreate` and `syncPermissions`, so it is safe to run multiple times.

---

## 5. Asset Management

### 5.1 Asset Types Supported

| Type | Description |
|------|-------------|
| `computer` | Desktops, laptops, workstations |
| `printer` | Printers, scanners, copiers |
| `server` | Physical and virtual servers |
| `network_device` | Switches, routers, access points |
| `other` | Any equipment not in above categories |

### 5.2 Asset Statuses

| Status | Meaning |
|--------|---------|
| `active` | In normal operational use |
| `maintenance` | Currently under repair/maintenance |
| `retired` | No longer in active use but retained |
| `disposed` | Removed from inventory |

### 5.3 CSV Import Format

Download a template or prepare a CSV with these columns:

```csv
name,type,serial_number,purchase_date,location,status,warranty_expiry,notes,assigned_to
"Dell Latitude 5420","computer","SN123456","2024-01-15","Head Office IT","active","2027-01-15","","profile-uuid"
```

**Required columns:** `name`, `type`, `serial_number`, `purchase_date`, `location`, `status`  
**Optional columns:** `warranty_expiry`, `notes`, `assigned_to` (Profile UUID)

### 5.4 Linking Assets to Users

When creating or editing an asset:
1. In the **"Assigned To"** field, search for and select a user profile.
2. This creates the `assigned_to` relationship on the asset record.

---

## 6. Ticket Management and Oversight

### 6.1 Super Admin Ticket Visibility

Super Admins see **all tickets** from all departments. Use filters to narrow the view:
- By **Status**
- By **Priority**
- By **Support Category**
- By **Technician**
- By **Requester**
- By **Asset**

### 6.2 Ticket Routing Logic

When a ticket is submitted, the system automatically assigns a manager (`assigned_manager_id`) using this priority order:

1. **Explicit match:** A manager whose `profile.support_category` equals the ticket's `support_category`
2. **Heuristic match:** A manager whose department name, email, or user name contains category-specific keywords (e.g., "SAP", "IT", "facility")
3. **Fallback:** Any `admin` role user, then any `super_admin`

**Routing Cache:**
- Results are cached for 1–5 minutes
- Cache is automatically invalidated when users are created or roles change
- To manually clear: run `php artisan cache:clear` on the server

### 6.3 Domain Isolation (Technician Assignment)

When assigning a technician to a ticket, the system enforces domain isolation:

| Ticket Category | Allowed Technicians |
|----------------|---------------------|
| `it_support` | Non-SAP, Non-Facility technicians |
| `sap` | Technicians with SAP-related department/name |
| `general` | Facility/non-SAP technicians |

This is determined by keyword scanning of the technician's `department`, `name`, and `email` fields.

### 6.4 Overriding Ticket Routing

To re-route a ticket to a different department:
1. Open the ticket (as admin/super_admin).
2. Click **"Transfer"**.
3. Select the new **Support Category**.
4. Provide an optional reason.
5. Confirm.

---

## 7. Notification System Management

### 7.1 In-App Notifications

In-app notifications are written **synchronously** to the database and do not require a queue worker. They are always delivered as long as the database is operational.

**Deduplication:** The system suppresses duplicate notifications sent to the same user within 60 seconds.

### 7.2 Notification Types

| Type | Color Indicator | Use Case |
|------|----------------|---------|
| `info` | Blue | Informational updates |
| `success` | Green | Completed actions, approvals |
| `warning` | Yellow | Attention needed, reopened tickets |
| `error` | Red | Rejections, failures |

### 7.3 Managing System Notifications

Administrators receive many system notifications. Use the **Notifications** page to:
- View all notifications with their status
- Mark individual notifications as read
- Mark all as read to clear the badge count

---

## 8. Telegram Bot Administration

### 8.1 Prerequisites

1. Create a Telegram bot via [@BotFather](https://t.me/BotFather)
2. Get the **bot token** and **bot username**
3. Set the webhook URL

### 8.2 Environment Variables

Add to `.env`:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_USERNAME=your_bot_username_without_@
```

### 8.3 Setting the Webhook

After deployment, register the webhook with Telegram:
```bash
curl -X POST "https://api.telegram.org/bot{YOUR_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.yourdomain.com/api/telegram/webhook"}'
```

### 8.4 Verifying the Webhook

```bash
curl "https://api.telegram.org/bot{YOUR_TOKEN}/getWebhookInfo"
```

### 8.5 What Users Need to Do

1. User generates a deep link in the app (Settings → Telegram)
2. User clicks the link → opens Telegram → bot sends `/start TOKEN`
3. Webhook receives the start command → links the account
4. User now receives Telegram notifications

### 8.6 Disabling Telegram Notifications

Set `TELEGRAM_BOT_TOKEN=` (empty) in `.env` and clear config cache. The service checks for an empty token and silently skips all Telegram sends.

---

## 9. SMS Gateway Administration

### 9.1 Drivers

| Driver | Behavior | Use Case |
|--------|---------|---------|
| `log` (default) | Writes SMS content to `storage/logs/laravel.log` | Development and testing |
| `api` | Sends real SMS via the configured gateway | Production |

### 9.2 Environment Variables

```env
SMS_DRIVER=api                            # Set to 'api' for production
SMS_API_URL=http://sms.gateway.com/send  # Your SMS gateway URL
SMS_AUTH_MODE=body                        # body | bearer | header | basic | none
SMS_API_KEY=your_api_key
SMS_DEVICE_ID=device_id                  # For Android SMS gateway apps
SMS_MODE=devices
SMS_SIM=1
SMS_CONTENT_TYPE=form                    # form | json
SMS_TO_FIELD=phone                       # Field name for recipient
SMS_MESSAGE_FIELD=message                # Field name for message text
```

### 9.3 Phone Number Requirements

The SMS service only sends to **Ethiopian mobile numbers**:
- Ethio Telecom: `09x` prefix → normalized to `2519XXXXXXXX`
- Safaricom ET: `07x` prefix → normalized to `2517XXXXXXXX`

Numbers in other formats are silently skipped. Users must enter valid Ethiopian phone numbers in their profiles.

### 9.4 Testing SMS

Set `SMS_DRIVER=log` and submit a ticket. Check `storage/logs/laravel.log` for messages like:
```
[SmsService] (log driver) to 251912345678: EEC IT: Your ticket...
```

### 9.5 Queue Worker Requirement

⚠️ **SMS is dispatched via the queue.** A queue worker must be running for SMS to be delivered:
```bash
php artisan queue:listen --tries=3
```

On cPanel, set up a cron job to process the queue (see Deployment Guide).

---

## 10. Email Configuration

### 10.1 Microsoft Graph Email

The system sends emails (new user registration notifications to Super Admins, ticket approval emails) via the **Microsoft Graph API**.

**Prerequisites:**
- An Azure Entra ID tenant
- An app registration with `Mail.Send` permission
- A licensed Microsoft 365 mailbox as the sender

**Environment Variables:**
```env
AZURE_GRAPH_TENANT_ID=your-tenant-id
AZURE_GRAPH_CLIENT_ID=your-client-id
AZURE_GRAPH_CLIENT_SECRET=your-client-secret
AZURE_GRAPH_SENDER_EMAIL=noreply@yourdomain.com
```

See [`microsoft_graph_email_integration.md.resolved`](../microsoft_graph_email_integration.md.resolved) for the full setup walkthrough.

### 10.2 Standard SMTP (Alternative)

If Microsoft Graph is not used, configure standard SMTP:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.yourdomain.com
MAIL_PORT=465
MAIL_USERNAME=your-email@yourdomain.com
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="EEC IT Support"
```

### 10.3 Testing Email

Set `MAIL_MAILER=log` to write emails to the log file instead of sending them. Then register a new user to trigger the admin notification email.

---

## 11. FAQ and Knowledge Base Management

### 11.1 Creating FAQ Articles

The quality of the FAQ knowledge base directly affects chatbot usefulness.

**Best Practices:**
- Use natural language questions users would actually ask
- Keep answers concise and actionable
- Use consistent categories (e.g., "Network", "Hardware", "Software", "SAP")
- Set `sort_order` to control article display order within categories
- Only **publish** articles that are verified and complete

### 11.2 Seeding Sample FAQs

A `FaqSeeder` is included with sample questions. Run:
```bash
php artisan db:seed --class=FaqSeeder
```

This seeds pre-written IT support FAQ articles. **Do not run in production without reviewing content first.**

### 11.3 Category Strategy

Since users can filter FAQs by category, use consistent, well-named categories:
- `Network Connectivity`
- `Hardware Issues`
- `Software & Applications`
- `SAP/ERP`
- `Email & Office 365`
- `General Support`

---

## 12. Reports and Data Export

### 12.1 Performance Report Metrics

The performance report (`/api/reports/performance`) calculates:

| Metric | Calculation |
|--------|------------|
| **Total Tickets** | Count of all tickets in date range |
| **Completed Tickets** | Count with status = `completed` |
| **In Progress Tickets** | Count with status = `in_progress` |
| **Overdue Tickets** | Past scheduled_date, not completed/cancelled |
| **Completion Rate** | `completed / total × 100` |
| **Avg Completion Days** | `AVG(DATEDIFF(completed_date, scheduled_date))` for completed tickets |
| **Technician Avg Rating** | `AVG(feedback_rating)` by technician |

### 12.2 CSV Export Columns

**Tickets Export:**
ID, Title, Type, Status, Priority, Asset, Requester, Assigned To, Scheduled Date, Completed Date, Created At

**Assets Export:**
ID, Name, Type, Status, Serial Number, Location, Assigned To, Purchase Date, Warranty Expiry, Created At

### 12.3 Scheduled Report Exports

Currently, reports must be manually exported via the UI. There is no automated report delivery implemented.

---

## 13. Activity Log Review

Navigate to **Activity Logs** (`/activity-logs`) to see all system audit events.

### 13.1 Logged Actions

| Action | Entity |
|--------|--------|
| `created` | Ticket, Asset, FAQ |
| `updated` | Ticket, Asset, FAQ |
| `deleted` | Ticket, Asset, FAQ |
| `approved` | Ticket |
| `rejected` | Ticket |
| `assigned` | Ticket |
| `started` | Ticket |
| `completed` | Ticket |
| `reviewed` | Ticket |
| `reopened` | Ticket |
| `feedback` | Ticket |
| `imported` | Asset (CSV import) |

### 13.2 Log Data

Each entry contains:
- **User** — who performed the action
- **Action** — what was done
- **Entity Type** — what type of record was affected
- **Entity ID** — the specific record
- **Description** — human-readable summary
- **Timestamp**

---

## 14. Preventive Maintenance Management

### 14.1 Creating Schedules

Navigate to **Schedules** (`/schedules`):

1. Click **"Add Schedule"**.
2. Select the **asset** to be maintained.
3. Set **type** (maintenance, inspection, etc.) and **frequency**.
4. Set the **next run date**.
5. Toggle **"Active"** to enable the schedule.

### 14.2 Automatic Ticket Generation

⚠️ **This feature requires manual setup.** A console command `maintenance:check-schedules` exists to create tickets from due schedules, but it is **not scheduled automatically**.

To automate ticket generation, add to cPanel Cron Jobs:
```bash
0 * * * * cd /path/to/backend && php artisan maintenance:check-schedules >> /dev/null 2>&1
```

Or add to `routes/console.php`:
```php
Schedule::command('maintenance:check-schedules')->hourly();
```

Then ensure the Laravel scheduler cron is set up:
```bash
* * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1
```

---

## 15. System Configuration Reference

### 15.1 Key Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_ENV` | `local` | `production` in prod |
| `APP_DEBUG` | `true` | Set to `false` in prod |
| `APP_URL` | `http://localhost` | Backend API URL |
| `FRONTEND_URL` | — | CORS allowed origin (frontend URL) |
| `DB_CONNECTION` | `sqlite` | `mysql` in production |
| `QUEUE_CONNECTION` | `database` | Job queue driver |
| `CACHE_STORE` | `database` | Cache driver |
| `SESSION_DRIVER` | `database` | Session driver |
| `REGISTRATION_AUTO_APPROVE_AFTER_MINUTES` | `0` | 0 = manual approval only |
| `REGISTRATION_SUPPORT_EMAIL` | — | Displayed to pending users |
| `SMS_DRIVER` | `log` | `api` for real SMS |
| `TELEGRAM_BOT_TOKEN` | — | Telegram bot token |
| `BCRYPT_ROUNDS` | `12` | Password hashing cost |

### 15.2 Clearing Application Cache

After changing `.env` values:
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

To clear all caches:
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

### 15.3 Queue Management

**Start the queue worker:**
```bash
php artisan queue:listen --tries=3 --delay=3
```

**View failed jobs:**
```bash
php artisan queue:failed
```

**Retry a failed job:**
```bash
php artisan queue:retry {job-id}
```

**Retry all failed jobs:**
```bash
php artisan queue:retry all
```

**Clear failed jobs:**
```bash
php artisan queue:flush
```

### 15.4 Storage Management

**Create storage symlink (required after deployment):**
```bash
php artisan storage:link
```

**Uploaded attachments location:**
`storage/app/public/ticket-attachments/`

Accessible at: `https://api.yourdomain.com/storage/ticket-attachments/filename`
