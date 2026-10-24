# Installation and Deployment Guide

**Document Title:** Installation and Deployment Guide  
**System Name:** EEC IT Asset & Ticket Management System  
**Version:** 1.0  
**Date:** October 2026  
**Audience:** System Administrators, DevOps

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Development Setup](#2-local-development-setup)
3. [Production Deployment on cPanel](#3-production-deployment-on-cpanel)
4. [Environment Configuration Reference](#4-environment-configuration-reference)
5. [Post-Deployment Checklist](#5-post-deployment-checklist)
6. [Queue Worker Configuration](#6-queue-worker-configuration)
7. [Scheduled Tasks (Cron Jobs)](#7-scheduled-tasks-cron-jobs)
8. [Updating the Application](#8-updating-the-application)
9. [GitHub + cPanel CI/CD Workflow](#9-github--cpanel-cicd-workflow)

---

## 1. Prerequisites

### 1.1 Server Requirements (Production)

| Requirement | Minimum Version | Notes |
|-------------|----------------|-------|
| PHP | 8.2+ | Laravel 12 requirement |
| MySQL | 8.0+ | Production database |
| Apache | 2.4+ | With mod_rewrite enabled |
| Composer | 2.x | Dependency manager |
| cPanel | Current | Shared hosting control panel |
| SSL Certificate | Any | Required for HTTPS/CORS |

### 1.2 Local Development Requirements

| Tool | Version | Purpose |
|------|---------|---------|
| PHP | 8.2+ | Backend runtime |
| SQLite | 3.x | Dev database (built into PHP) |
| Composer | 2.x | PHP dependencies |
| Node.js | 18 or 20 | Frontend build |
| npm / bun | Current | JS package manager |
| Git | 2.x | Version control |

---

## 2. Local Development Setup

### 2.1 Clone the Repository

```bash
git clone https://github.com/YOUR_ORG/asset-task-sync.git
cd asset-task-sync
```

The repo contains two directories:
- `asset-task-sync-backend/` — Laravel API
- `asset-task-sync-main/` — React frontend

### 2.2 Backend Setup

```bash
cd asset-task-sync-backend

# Install PHP dependencies
composer install

# Create environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Create SQLite database file
touch database/database.sqlite

# Run migrations and seed default data
php artisan migrate --seed

# Create storage symlink
php artisan storage:link
```

### 2.3 Configure Backend `.env`

Edit `asset-task-sync-backend/.env`:

```env
APP_NAME="EEC IT Support"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite
# Leave DB_HOST, DB_DATABASE etc. commented (SQLite uses a file)

QUEUE_CONNECTION=database
CACHE_STORE=database
SESSION_DRIVER=database

FRONTEND_URL=http://localhost:5173

# SMS: 'log' = write to log file (safe for dev)
SMS_DRIVER=log

# Telegram: leave empty to disable
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=

# Registration
REGISTRATION_AUTO_APPROVE_AFTER_MINUTES=0
REGISTRATION_SUPPORT_EMAIL=admin@example.com
```

### 2.4 Frontend Setup

```bash
cd ../asset-task-sync-main

# Install dependencies
npm install

# Create environment file
cp .env.production.example .env
```

Edit `asset-task-sync-main/.env`:
```env
VITE_API_URL=http://localhost:8000/api
```

### 2.5 Start Development Servers

**Backend (in one terminal):**
```bash
cd asset-task-sync-backend
php artisan serve
# Backend runs at: http://localhost:8000
```

**Queue worker (in another terminal):**
```bash
cd asset-task-sync-backend
php artisan queue:listen --tries=1
```

**Frontend (in another terminal):**
```bash
cd asset-task-sync-main
npm run dev
# Frontend runs at: http://localhost:5173
```

Or use the combined dev script from the backend root:
```bash
cd asset-task-sync-backend
composer dev
# Starts all: server, queue, pail logger, vite — in parallel
```

### 2.6 Default Login Credentials

| Role | Email | Password |
|------|-------|---------|
| Super Admin | `superadmin@example.com` | `password` |
| Admin | `admin@example.com` | `password` |
| Technician | `technician@example.com` | `password` |
| Requester | `requester@example.com` | `password` |

---

## 3. Production Deployment on cPanel

### 3.1 Architecture Overview

```
Production Setup (Recommended):
├── app.yourdomain.com  →  React SPA static files
└── api.yourdomain.com  →  Laravel API (doc root = /public)
```

### 3.2 Step 1: Prepare the Build Locally

**Build the Frontend:**

1. Update the API URL:
   ```
   asset-task-sync-main/src/integrations/laravel/client.ts
   ```
   Change `API_URL` to `https://api.yourdomain.com/api`

   Or create `asset-task-sync-main/.env.production`:
   ```env
   VITE_API_URL=https://api.yourdomain.com/api
   ```

2. Build the React app:
   ```bash
   cd asset-task-sync-main
   npm install
   npm run build
   # Output: dist/ folder
   ```

**Prepare the Backend:**
```bash
cd asset-task-sync-backend
composer install --optimize-autoloader --no-dev
```

### 3.3 Step 2: Set Up MySQL Database in cPanel

1. **cPanel → MySQL Databases**
2. Create database: `youruser_asset_sync`
3. Create database user with a strong password
4. Add user to database with **All Privileges**
5. Note: Host (usually `localhost`), database name, username, password

### 3.4 Step 3: Deploy the Backend

**Upload files:**
Upload `asset-task-sync-backend/` to:
```
/home/youruser/api.yourdomain.com/
```

**Create API subdomain:**
1. **cPanel → Domains → Create Subdomain**
2. Subdomain name: `api`
3. Document root: `/home/youruser/api.yourdomain.com/public`

**Create `.env` on the server:**

Create `api.yourdomain.com/.env` with:
```env
APP_NAME="EEC IT Support"
APP_ENV=production
APP_KEY=                          # Will be generated below
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=youruser_asset_sync
DB_USERNAME=youruser_dbuser
DB_PASSWORD=your_db_password

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

FILESYSTEM_DISK=public

FRONTEND_URL=https://app.yourdomain.com

MAIL_MAILER=smtp
MAIL_HOST=smtp.yourdomain.com
MAIL_PORT=465
MAIL_USERNAME=noreply@yourdomain.com
MAIL_PASSWORD=your_mail_password
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="EEC IT Support"

SMS_DRIVER=api
SMS_API_URL=https://your-sms-gateway.com/send
SMS_AUTH_MODE=body
SMS_API_KEY=your_sms_key

TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username

REGISTRATION_AUTO_APPROVE_AFTER_MINUTES=0
REGISTRATION_SUPPORT_EMAIL=itsupport@yourdomain.com
```

**Run Laravel setup commands** (via SSH/Terminal):
```bash
cd ~/api.yourdomain.com

# Generate encryption key
php artisan key:generate

# Run database migrations and seed data
php artisan migrate --seed --force

# Create storage symlink for file uploads
php artisan storage:link

# Optimize for production
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

**Set permissions:**
```bash
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
# (exact ownership depends on your cPanel setup)
```

**Set PHP version:**
- **cPanel → MultiPHP Manager** → set `api.yourdomain.com` to PHP 8.2 or higher

### 3.5 Step 4: Deploy the Frontend

**Option A: Upload built files**

Upload all contents of `asset-task-sync-main/dist/` to:
```
/home/youruser/app.yourdomain.com/
```

**Option B: Build on cPanel using Node.js App**

1. **cPanel → Software → Setup Node.js App → Create Application**
   - Node.js version: 18 or 20
   - Application root: `/home/youruser/asset-task-sync-main`
   - Application mode: Production
2. cPanel shows an "Enter virtual environment" command — run it in Terminal
3. In Terminal:
   ```bash
   cd ~/asset-task-sync-main
   npm install
   npm run build
   cp -r dist/* ~/app.yourdomain.com/
   ```

**Create frontend subdomain:**
1. **cPanel → Domains → Create Subdomain**
2. Name: `app`
3. Document root: `/home/youruser/app.yourdomain.com`

**Create `.htaccess` for SPA routing:**

Create `app.yourdomain.com/.htaccess`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

> **Why this is needed:** Without this file, refreshing a page like `/tickets` returns a 404 because Apache looks for a file named `tickets`. This rule redirects all non-file requests to `index.html` for React Router to handle.

### 3.6 Step 5: Enable SSL

1. **cPanel → SSL/TLS → AutoSSL** — enable for both:
   - `app.yourdomain.com`
   - `api.yourdomain.com`
2. Verify `APP_URL` and `FRONTEND_URL` in `.env` use `https://`.
3. Run `php artisan config:cache` after any `.env` changes.

---

## 4. Environment Configuration Reference

See [Section 15 of the Administrator Manual](./07_AdminManual.md#15-system-configuration-reference) for the complete configuration variable reference.

**Frontend Environment Variables (`asset-task-sync-main/.env.production`):**

```env
VITE_API_URL=https://api.yourdomain.com/api
```

> The Vite build tool replaces `import.meta.env.VITE_*` variables at build time. After changing this file, you **must rebuild** the frontend.

---

## 5. Post-Deployment Checklist

Run through this checklist after every deployment:

- [ ] Visit `https://app.yourdomain.com` — login page loads without errors
- [ ] Visit `https://api.yourdomain.com` — see Laravel JSON response (not directory listing)
- [ ] Log in with Super Admin credentials
- [ ] **Immediately change default passwords** for all seeded users
- [ ] Open browser DevTools → Network tab — verify API calls go to `https://api.yourdomain.com/api/...`
- [ ] Submit a test ticket — verify it appears in the system
- [ ] Check in-app notification appears
- [ ] Verify no CORS errors in browser console
- [ ] Check `storage/logs/laravel.log` for any errors
- [ ] Configure SMS, Telegram, and Email (see Admin Manual sections 8–10)
- [ ] Set up queue worker cron job
- [ ] Set up Laravel scheduler cron job
- [ ] Configure `support_category` for all Admin accounts

---

## 6. Queue Worker Configuration

The queue worker processes background jobs (SMS, Telegram, Email notifications).

### 6.1 Why the Queue Worker is Required

Without a running queue worker, the following **will NOT work**:
- SMS notifications
- Telegram ticket notifications
- Microsoft Graph email delivery

In-app notifications are **not** queued — they always work.

### 6.2 cPanel Cron Job Setup

Add this cron job in **cPanel → Cron Jobs** to process the queue every minute:

```bash
* * * * * cd /home/youruser/api.yourdomain.com && php artisan queue:work --max-jobs=10 --tries=3 >> /home/youruser/queue.log 2>&1
```

Or using `queue:listen` (restarts after each job):
```bash
* * * * * cd /home/youruser/api.yourdomain.com && php artisan queue:listen --tries=3 >> /home/youruser/queue.log 2>&1
```

> **Note on shared hosting:** On shared hosting, a persistent daemon worker is not always available. The cron approach processes jobs on each run. For high-volume environments, consider a VPS with `supervisor` managing the worker.

### 6.3 Supervisor (VPS/Dedicated Server)

If you have root access:

```ini
[program:eec_queue_worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/api.yourdomain.com/artisan queue:work database --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/api.yourdomain.com/storage/logs/queue-worker.log
```

Start with:
```bash
supervisorctl reread && supervisorctl update && supervisorctl start eec_queue_worker:*
```

---

## 7. Scheduled Tasks (Cron Jobs)

### 7.1 Laravel Scheduler

Add this cron to cPanel to run the Laravel task scheduler every minute:
```bash
* * * * * cd /home/youruser/api.yourdomain.com && php artisan schedule:run >> /dev/null 2>&1
```

### 7.2 Scheduled Commands

| Command | Default Schedule | Description |
|---------|-----------------|-------------|
| `tickets:auto-close` | Not scheduled by default | Auto-closes tickets pending review for 3+ days |
| `maintenance:check-schedules` | Not scheduled by default | Creates tickets from due preventive maintenance schedules |

**To activate these commands**, edit `asset-task-sync-backend/routes/console.php`:
```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('tickets:auto-close')->daily();
Schedule::command('maintenance:check-schedules')->hourly();
```

Or add separate cron jobs directly:
```bash
0 2 * * * cd /home/youruser/api.yourdomain.com && php artisan tickets:auto-close >> /dev/null 2>&1
0 * * * * cd /home/youruser/api.yourdomain.com && php artisan maintenance:check-schedules >> /dev/null 2>&1
```

---

## 8. Updating the Application

### 8.1 Backend Update

```bash
cd ~/api.yourdomain.com

# Pull latest changes (if using git)
git pull

# Update dependencies
composer install --optimize-autoloader --no-dev

# Run new migrations
php artisan migrate --force

# Refresh caches
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 8.2 Frontend Update

```bash
# Build locally (or on cPanel with Node)
cd asset-task-sync-main
npm install
npm run build

# Upload dist/* to app.yourdomain.com/
# Or if building on cPanel:
cp -r dist/* ~/app.yourdomain.com/
```

### 8.3 Database Rollback (Emergency)

If a migration introduces a problem:
```bash
php artisan migrate:rollback    # Rolls back the last batch
php artisan migrate:rollback --step=2   # Rolls back 2 batches
```

> ⚠️ **Warning:** Rolling back data migrations may cause data loss. Always back up the database before applying updates to production.

---

## 9. GitHub + cPanel CI/CD Workflow

### 9.1 Setup

1. In cPanel, go to **Git Version Control → Create Repository**
2. Clone the GitHub repo or set the remote:
   ```bash
   cd ~/api.yourdomain.com
   git remote add origin https://github.com/YOUR_ORG/asset-task-sync.git
   ```
3. Create a `.cpanel.yml` deployment file in the repo root:
   ```yaml
   ---
   deployment:
     tasks:
       - export DEPLOYPATH=/home/youruser/api.yourdomain.com/
       - /bin/cp -R asset-task-sync-backend $DEPLOYPATH
       - cd $DEPLOYPATH && composer install --no-dev --optimize-autoloader
       - cd $DEPLOYPATH && php artisan migrate --force
       - cd $DEPLOYPATH && php artisan config:cache
       - cd $DEPLOYPATH && php artisan route:cache
   ```

4. In cPanel **Git Version Control**, click **Pull or Deploy** to trigger a manual deploy.

See [`GITHUB_CPANEL_WORKFLOW.md`](../GITHUB_CPANEL_WORKFLOW.md) for the complete GitHub Actions + cPanel workflow documentation.
