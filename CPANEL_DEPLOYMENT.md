# cPanel Deployment Guide

This guide explains how to deploy the **EEC IT Maintenance Scheduler** (Laravel API + React frontend) on cPanel shared hosting.

## Architecture Overview

| Part | Location on cPanel | Example URL |
|------|--------------------|-------------|
| Frontend (React) | Main domain `public_html` | `https://yourdomain.com` |
| Backend (Laravel API) | Subdomain document root → `public/` | `https://api.yourdomain.com` |

Using a subdomain for the API is the recommended and simplest approach on cPanel.

---

## Prerequisites

- cPanel hosting with **PHP 8.2+** (Laravel 12 requirement)
- **MySQL** database access
- **SSH/Terminal** access (preferred) or ability to upload `vendor/` from your computer
- **Composer** (on server or locally)
- **Node.js** (locally, for building the frontend)
- SSL enabled for both domain and API subdomain

---

## Part 1 — Prepare on Your Computer

### 1. Update the Frontend API URL

Before building, edit the API base URL in:

`asset-task-sync-main/src/integrations/laravel/client.ts`

```typescript
const API_URL = 'https://api.yourdomain.com/api';
```

Replace `api.yourdomain.com` with your real API subdomain.

### 2. Build the Frontend

```bash
cd asset-task-sync-main
npm install
npm run build
```

This creates a `dist/` folder. Upload the contents of `dist/` to `public_html` on cPanel.

> If `npm run build` fails with a permission error locally, use `node node_modules/vite/bin/vite.js build` instead.

### 3. Prepare the Backend

```bash
cd asset-task-sync-backend
composer install --optimize-autoloader --no-dev
```

Upload the entire `asset-task-sync-backend` folder to the server, **excluding** `.env` (create that on the server).

---

## Part 2 — cPanel: Database Setup

1. Open **cPanel → MySQL Databases**
2. Create a database, e.g. `youruser_asset_sync`
3. Create a MySQL user with a strong password
4. Add the user to the database with **All Privileges**
5. Note these values:
   - **Host:** usually `localhost`
   - **Database name**
   - **Username**
   - **Password**

---

## Part 3 — cPanel: Backend (Laravel API)

### 1. Create API Subdomain

1. Go to **cPanel → Domains → Create Subdomain**
2. Subdomain: `api`
3. Set the **document root** to Laravel's `public` folder, for example:

   ```
   /home/youruser/api.yourdomain.com/public
   ```

   **Important:** The document root must point to `public/`, not the Laravel project root.

### 2. Upload Backend Files

Upload `asset-task-sync-backend` to a path such as:

```
/home/youruser/api.yourdomain.com/
```

Expected structure:

```
api.yourdomain.com/
├── app/
├── bootstrap/
├── config/
├── database/
├── public/          ← document root points here
│   └── index.php
├── routes/
├── storage/
├── vendor/
└── .env
```

### 3. Create `.env` on the Server

Create `.env` in the Laravel root (copy from `.env.example`) and set production values:

```env
APP_NAME=IT_Maintenance_Scheduler
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=youruser_asset_sync
DB_USERNAME=youruser_dbuser
DB_PASSWORD=your_db_password

FRONTEND_URL=https://yourdomain.com

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

MAIL_MAILER=smtp
MAIL_HOST=smtp.yourdomain.com
MAIL_PORT=465
MAIL_USERNAME=your-email@yourdomain.com
MAIL_PASSWORD=your-mail-password
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS="noreply@yourdomain.com"
MAIL_FROM_NAME="${APP_NAME}"
```

See [EMAIL_SETUP.md](EMAIL_SETUP.md) for detailed mail configuration.

Leave `APP_KEY` empty until you run `php artisan key:generate`; Laravel will fill it automatically.

### 4. Run Laravel Commands

If your host provides **Terminal** or **SSH**:

```bash
cd ~/api.yourdomain.com

php artisan key:generate
php artisan migrate --seed --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 5. Set Folder Permissions

```bash
chmod -R 775 storage bootstrap/cache
```

In cPanel File Manager, ensure `storage` and `bootstrap/cache` are writable by the web server.

### 6. Set PHP Version

In **cPanel → Select PHP Version** (or MultiPHP Manager), set **PHP 8.2 or higher** for the API subdomain.

---

## Part 4 — cPanel: Frontend (React)

You can build the frontend **on your computer** or **on cPanel** if **Setup Node.js App** is available.

### Option A — Build locally, upload `dist/`

#### 1. Upload build output

Upload everything inside `asset-task-sync-main/dist/` to:

```
/home/youruser/public_html/
```

Expected structure:

```
public_html/
├── index.html
├── assets/
└── ...
```

### Option B — Build on cPanel using Node.js

1. Go to **cPanel → Software → Setup Node.js App**
2. Click **Create Application**
3. Set:
   - **Node.js version:** 18 or 20
   - **Application mode:** Production
   - **Application root:** `/home/youruser/asset-task-sync/asset-task-sync-main`
   - **Application URL:** your main domain (optional if only used for building)
4. Update API URL in `src/integrations/laravel/client.ts` on the server:

   ```typescript
   const API_URL = 'https://api.yourdomain.com/api';
   ```

5. In **Terminal**, activate the Node virtualenv (cPanel shows this command on the Node.js app page), then:

   ```bash
   cd ~/asset-task-sync/asset-task-sync-main
   npm install
   npm run build
   cp -r dist/* ~/public_html/
   ```

   If `npm run build` fails, use:

   ```bash
   node node_modules/vite/bin/vite.js build
   cp -r dist/* ~/public_html/
   ```

> **Note:** After `npm run build`, the live site is static files in `public_html`. You do not need Node running as a long-lived server for this React app.

### Add `.htaccess` for React routing (both options)

Create `public_html/.htaccess` so client-side routes (e.g. `/tickets`, `/auth`) work on refresh:

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

Without this file, refreshing pages like `/tickets` will return a 404.

---

## Part 5 — SSL (HTTPS)

In **cPanel → SSL/TLS** (or AutoSSL), enable HTTPS for:

- `yourdomain.com`
- `api.yourdomain.com`

Use `https://` in:

- Backend `.env`: `APP_URL`, `FRONTEND_URL`
- Frontend `client.ts`: `API_URL`

---

## Part 6 — Cron Jobs (Optional)

If you use scheduled tasks such as auto-closing tickets, add a cron job in **cPanel → Cron Jobs**:

```bash
* * * * * cd /home/youruser/api.yourdomain.com && php artisan schedule:run >> /dev/null 2>&1
```

This runs Laravel's scheduler. In this project, the scheduler currently includes:

- `tickets:auto-close` — auto-close tickets pending review for 3+ days

The command `maintenance:check-schedules` also exists for creating tickets from preventive maintenance schedules, but it is not scheduled by default in `asset-task-sync-backend/routes/console.php`. To run it automatically, add it to the scheduler there or create a separate cron job:

```bash
0 * * * * cd /home/youruser/api.yourdomain.com && php artisan maintenance:check-schedules >> /dev/null 2>&1
```

---

## Post-Deployment Checklist

1. Visit `https://yourdomain.com` — login page loads
2. Visit `https://api.yourdomain.com` — Laravel responds (not a directory listing)
3. Log in with default admin credentials:
   - **Email:** `admin@example.com`
   - **Password:** `password`
4. Change the default admin password immediately after first login
5. Open browser DevTools → Network tab — API calls should go to `https://api.yourdomain.com/api/...`
6. If CORS errors appear, confirm `FRONTEND_URL` in backend `.env` and run:

   ```bash
   php artisan config:cache
   ```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **500 error on API** | Check `storage/logs/laravel.log`, folder permissions, `.env` values, and PHP version (8.2+) |
| **CORS error in browser** | Set `FRONTEND_URL=https://yourdomain.com` in `.env`, then `php artisan config:cache` |
| **404 on `/tickets` or other routes** | Add SPA `.htaccess` in `public_html` (see Part 4) |
| **Database connection failed** | Verify cPanel MySQL host (`localhost`), database name, username, and password |
| **No Terminal / Composer on server** | Run `composer install --no-dev --optimize-autoloader` locally and upload the `vendor/` folder |
| **API still calls localhost** | Update `client.ts`, rebuild (`npm run build` on cPanel Node or locally), copy `dist/` to `public_html` |
| **Blank page on frontend** | Check browser console; ensure `assets/` folder was uploaded with `index.html` |
| **Authorization / login fails** | Confirm `APP_URL` matches the API subdomain and SSL is active |

---

## Alternative: Same Domain (No Subdomain)

If you cannot use a subdomain:

- Frontend → `public_html`
- API → `public_html/api` (requires additional Apache rewrite configuration)

The **subdomain approach is strongly recommended** because it avoids complex rewrite rules and keeps Laravel's `public/` folder as the document root.

---

## Default Users (After Seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | password |
| Technician | technician@example.com | password |
| Requester | requester@example.com | password |

**Change these passwords before going live.**

---

## Related Documentation

- [README.md](README.md) — Project overview and local development setup
- [EMAIL_SETUP.md](EMAIL_SETUP.md) — Email / SMTP configuration
- [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md) — Telegram bot integration

---

**Built with Laravel and React**
Important idea first
This React app is static after build. Node.js on cPanel is used to run:

npm install
npm run build
You do not need Node running 24/7. After build, Apache serves the files from your frontend subdomain folder.

Your layout (subdomains)
Part	Subdomain	What lives there
Frontend
app.yourdomain.com
Built files from dist/
Backend
api.yourdomain.com
Laravel → document root = public/
Part 1 — Upload / clone project on cPanel
In Terminal:

cd ~
git clone https://github.com/YOUR_USERNAME/asset-task-sync.git
cd asset-task-sync
Or upload both folders with File Manager:

~/asset-task-sync/
├── asset-task-sync-backend/
└── asset-task-sync-main/
Part 2 — Backend (API subdomain) — no Node needed
cPanel → Domains → Create Subdomain

Name: api

Document root:

/home/youruser/asset-task-sync/asset-task-sync-backend/public
Create MySQL database + user in cPanel.

Create .env in asset-task-sync-backend/:

APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com
DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=youruser_asset_sync
DB_USERNAME=youruser_dbuser
DB_PASSWORD=your_password
FRONTEND_URL=https://app.yourdomain.com
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
Run in Terminal:
cd ~/asset-task-sync/asset-task-sync-backend
composer install --optimize-autoloader --no-dev
php artisan key:generate
php artisan migrate --seed --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
chmod -R 775 storage bootstrap/cache
Set PHP 8.2+ for the API subdomain.
Part 3 — Frontend using Setup Node.js App
Step 1: Create the Node.js app
cPanel → Software → Setup Node.js App → Create Application

Field	Value
Node.js version
18 or 20
Application mode
Production
Application root
/home/youruser/asset-task-sync/asset-task-sync-main
Application URL
Can be app.yourdomain.com or any temp URL (used mainly for build)
Startup file
app.js (not used for Vite static build)
Save the app. cPanel shows an “Enter to the virtual environment” command — copy it.

Step 2: Set production API URL
Create this file on the server:

asset-task-sync-main/.env.production

VITE_API_URL=https://api.yourdomain.com/api
Replace with your real API subdomain.

Step 3: Install and build (in Terminal)
# Paste cPanel's virtualenv command first, e.g.:
source /home/youruser/nodevenv/asset-task-sync-main/20/bin/activate
cd ~/asset-task-sync/asset-task-sync-main
npm install
npm run build
If build fails:

node node_modules/vite/bin/vite.js build
That creates dist/ with index.html and assets/.

Step 4: Create frontend subdomain
cPanel → Domains → Create Subdomain

Name: app

Document root:

/home/youruser/app.yourdomain.com
Step 5: Copy build output to frontend subdomain
cp -r ~/asset-task-sync/asset-task-sync-main/dist/* ~/app.yourdomain.com/
Or in File Manager: copy everything inside dist/ → app.yourdomain.com/.

Step 6: Add .htaccess for React routes
In app.yourdomain.com/.htaccess:

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
Step 7: SSL
Enable SSL for:

app.yourdomain.com
api.yourdomain.com
Part 4 — Test
Open https://app.yourdomain.com → login page
Open https://api.yourdomain.com → Laravel responds
Login: superadmin@example.com / password (change after first login)
DevTools → Network → requests go to https://api.yourdomain.com/api/...
When you update code later
cd ~/asset-task-sync
git pull
# Backend (if PHP changed)
cd asset-task-sync-backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
# Frontend (if React changed)
source /home/youruser/nodevenv/asset-task-sync-main/20/bin/activate
cd ~/asset-task-sync/asset-task-sync-main
npm install
npm run build
cp -r dist/* ~/app.yourdomain.com/
Common mistakes
Mistake	Fix
API doc root not public/
Point subdomain to .../backend/public
Still calling localhost
Set VITE_API_URL in .env.production, rebuild, recopy dist/
CORS errors
FRONTEND_URL=https://app.yourdomain.com + php artisan config:cache
404 on /tickets refresh
Add SPA .htaccess on frontend
Node app “running” but blank site
Site is static files in app.yourdomain.com, not the Node app URL
Summary
API subdomain → Laravel public/ + .env + migrate
Setup Node.js App → only to npm install + npm run build
Copy dist/ → app.yourdomain.com
Node can stop after build — Apache serves the frontend
If you share your exact subdomain names (e.g. app.eec.org and api.eec.org), I can fill in the exact paths and .env values for your cPanel username.