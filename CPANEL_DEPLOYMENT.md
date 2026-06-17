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
node node_modules/vite/bin/vite.js build
```

This creates a `dist/` folder. Upload the contents of `dist/` to `public_html` on cPanel.

> If `npm run dev` fails with a permission error locally, use `node node_modules/vite/bin/vite.js` instead.

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
APP_KEY=base64:...          # generate on server
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

### 4. Run Laravel Commands

If your host provides **Terminal** or **SSH**:

```bash
cd ~/api.yourdomain.com

php artisan key:generate
php artisan migrate --seed
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

### 1. Upload Build Output

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

### 2. Add `.htaccess` for React Routing

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

If you use scheduled maintenance or auto-close tickets, add a cron job in **cPanel → Cron Jobs**:

```bash
* * * * * cd /home/youruser/api.yourdomain.com && php artisan schedule:run >> /dev/null 2>&1
```

This runs Laravel's scheduler, which includes:

- `tickets:auto-close` — auto-close tickets pending review for 3+ days
- `maintenance:check-schedules` — create tickets from preventive maintenance schedules

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
| **No Terminal / Composer on server** | Run `composer install --no-dev` locally and upload the `vendor/` folder |
| **API still calls localhost** | Update `client.ts`, rebuild frontend (`npm run build`), and re-upload `dist/` |
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
