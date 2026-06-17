# GitHub + cPanel Workflow

This guide explains how to push the project to GitHub, clone it on cPanel, and keep the server updated after code changes.

The project has **two folders in one repository**:

```
your-project/
├── asset-task-sync-backend/    ← API (Laravel)
└── asset-task-sync-main/       ← frontend (React)
```

One GitHub repo → one clone → both folders on the server, same as on your computer.

---

## Part 1 — Push to GitHub (First Time)

### 1. Create a repo on GitHub

1. Go to [github.com](https://github.com) → **New repository**
2. Name it e.g. `asset-task-sync`
3. Do **not** add README, .gitignore, or license (you already have files)
4. Copy the repo URL, e.g. `https://github.com/YOUR_USERNAME/asset-task-sync.git`

### 2. Initialize git in the project folder

```bash
cd "/path/to/asset-task-sync-main (1)"

git init
```

> **Important:** Run `git init` inside the project folder, not your home directory.

### 3. Add a root `.gitignore`

Create `.gitignore` in the project root:

```gitignore
# Secrets — NEVER commit these
**/.env
**/.env.local
**/.env.production

# Dependencies
**/node_modules/
**/vendor/

# Build output
**/dist/

# OS / editor
.DS_Store
.idea/
.vscode/
```

### 4. Commit and push

```bash
git add .
git status
```

Confirm `.env` is **not** listed, then:

```bash
git commit -m "Initial commit: Laravel backend and React frontend"

git branch -M main

git remote add origin https://github.com/YOUR_USERNAME/asset-task-sync.git

git push -u origin main
```

Replace `YOUR_USERNAME/asset-task-sync` with your real repo URL.

### 5. GitHub authentication

- **HTTPS:** use a [Personal Access Token](https://github.com/settings/tokens) as the password
- **SSH:** use `git@github.com:YOUR_USERNAME/asset-task-sync.git` if SSH keys are set up

---

## Part 2 — Clone on cPanel (First Time)

### 1. Clone the repository

In **cPanel Terminal** or SSH:

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/asset-task-sync.git
cd asset-task-sync
```

You will see both folders:

```
asset-task-sync/
├── asset-task-sync-backend/
├── asset-task-sync-main/
├── README.md
├── CPANEL_DEPLOYMENT.md
└── ...
```

### 2. Backend setup (one time)

```bash
cd ~/asset-task-sync/asset-task-sync-backend

# Create .env on the server (never in GitHub)
cp .env.example .env
nano .env
```

Set production values: database, `APP_URL`, `FRONTEND_URL`, mail, etc. See [CPANEL_DEPLOYMENT.md](CPANEL_DEPLOYMENT.md) for full `.env` example.

Then run:

```bash
composer install --optimize-autoloader --no-dev
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache

chmod -R 775 storage bootstrap/cache
```

Point your API subdomain document root to:

```
~/asset-task-sync/asset-task-sync-backend/public
```

### 3. Frontend setup (one time)

On your **local computer** (or any machine with Node.js):

1. Set the production API URL in `asset-task-sync-main/src/integrations/laravel/client.ts`:

   ```typescript
   const API_URL = 'https://api.yourdomain.com/api';
   ```

2. Build the frontend:

   ```bash
   cd asset-task-sync-main
   npm install
   node node_modules/vite/bin/vite.js build
   ```

3. Upload everything inside `dist/` to cPanel `public_html/`

4. Add SPA `.htaccess` in `public_html` (see [CPANEL_DEPLOYMENT.md](CPANEL_DEPLOYMENT.md))

---

## Part 3 — After You Update Code

### On your computer (every update)

```bash
cd "/path/to/your-project"

git add .
git commit -m "Describe your change"
git push
```

### On cPanel / server (every update)

```bash
cd ~/asset-task-sync
git pull
```

Then run **only what changed**:

| What you changed | What to do on server |
|------------------|----------------------|
| **Backend only** (PHP, routes, migrations) | Backend steps below |
| **Frontend only** (React/UI) | Rebuild `dist/` and re-upload to `public_html` |
| **Both** | Do both |

#### Backend after `git pull`

```bash
cd ~/asset-task-sync/asset-task-sync-backend

composer install --optimize-autoloader --no-dev   # if composer.json changed
php artisan migrate --force                        # if new migrations exist
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

#### Frontend after `git pull`

Rebuild on your computer and upload `dist/` again (typical on shared hosting):

```bash
cd asset-task-sync-main
node node_modules/vite/bin/vite.js build
```

Upload `dist/*` → `public_html/` via cPanel File Manager or FTP.

---

## Workflow Diagram

```
Your PC                    GitHub                    cPanel
────────                   ──────                    ──────
edit code        →    git push          →    git pull
build frontend   →    (dist not in git) →    upload dist to public_html
.env stays local →    never pushed      →    .env only on server
```

### What goes where

| Item | In GitHub? | On server? |
|------|------------|------------|
| Source code (both folders) | Yes | Yes (via `git pull`) |
| `.env` | **Never** | Yes (create manually) |
| `dist/` (frontend build) | Usually no | Yes (build + upload) |
| `vendor/` (PHP deps) | No | Yes (`composer install`) |
| `node_modules/` | No | Only if building on server |

---

## Quick Checklist After Every Update

1. `git pull` on server
2. Backend changed? → `composer install`, `migrate --force`, `config:cache`
3. Frontend changed? → rebuild + upload `dist/`
4. Test the site in the browser
5. Check browser DevTools → Network for API errors

---

## Before Every Push (Local)

- [ ] `.env` files are **not** in `git status`
- [ ] `node_modules/` and `vendor/` are **not** tracked
- [ ] No secrets (mail passwords, API tokens) in committed files

---

## Optional: Two Separate Repos

If you prefer separate repositories:

| GitHub repo | Folder |
|-------------|--------|
| `asset-task-sync-backend` | `asset-task-sync-backend/` only |
| `asset-task-sync-frontend` | `asset-task-sync-main/` only |

For most teams, **one repo with both folders** is simpler to manage.

---

## Related Documentation

- [CPANEL_DEPLOYMENT.md](CPANEL_DEPLOYMENT.md) — Full cPanel deployment guide
- [README.md](README.md) — Local development setup
- [EMAIL_SETUP.md](EMAIL_SETUP.md) — Email / SMTP configuration
- [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md) — Telegram bot integration

---

**Built with Laravel and React**
