# Queue-based Email Sending (Laravel)

This document explains how to enable and run queue-based email sending for this project (backend). It covers local testing, migrations, making mailables queueable, running a worker, and recommended production setup with Supervisor or systemd.

---

## Summary

Using queues for email ensures that sending mail does not block HTTP requests and improves responsiveness. This project uses the `database` queue driver by default for simplicity.

What this guide covers:
- Configure `.env` for queue and mail
- Ensure the `jobs` table exists and migrations are applied
- Make Mailables `ShouldQueue` and enqueue mail sending
- Run a local queue worker
- Production: Supervisor / systemd sample configs
- Testing and troubleshooting

---

## 1) Prerequisites

- PHP and Composer installed
- MySQL (or other DB) configured and migrated
- Access to the server to run background workers (Supervisor or systemd)

---

## 2) Environment (.env) examples

Set the queue connection and mailer in your backend `.env` (edit values to match your provider):

```env
# Queue (database driver)
QUEUE_CONNECTION=database

# Mail - preferred: transactional provider (Mailgun example)
MAIL_MAILER=mailgun
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_SECRET=key-your-mailgun-key
MAIL_FROM_ADDRESS=no-reply@yourdomain.com
MAIL_FROM_NAME="Your Company"

# Alternative (SMTP) - not recommended for high volume
# MAIL_MAILER=smtp
# MAIL_HOST=smtp.gmail.com
# MAIL_PORT=587
# MAIL_USERNAME=you@example.com
# MAIL_PASSWORD=your_smtp_password_or_app_password
# MAIL_ENCRYPTION=tls
```

Notes:
- Use a transactional provider (Mailgun, SendGrid, SES, Postmark) for better deliverability and DKIM/SPF setup.
- Ensure `MAIL_FROM_ADDRESS` is a verified domain address (not a personal Gmail) for best deliverability.

---

## 3) Ensure jobs table & migrations

If your project doesn't have a `jobs` table, create it:

```bash
cd asset-task-sync-backend
php artisan queue:table
php artisan migrate
```

> This repository already includes a jobs migration (`create_jobs_table.php`) in `database/migrations`.

---

## 4) Make Mailables queueable

Mailables should implement `ShouldQueue`. Example (already applied for `AccountApproved`):

```php
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;

class AccountApproved extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;
    // ...
}
```

When sending mail, use `queue()` instead of `send()`:

```php
// enqueue
\Illuminate\Support\Facades\Mail::to($user->email)->queue(new \App\Mail\AccountApproved($user));

// immediate send (blocking):
// Mail::to(...)->send(...);
```

This project has been updated to queue `AccountApproved` emails.

---

## 5) Run a local queue worker (development)

Start a worker that processes queued jobs:

```bash
cd asset-task-sync-backend
php artisan queue:work --sleep=3 --tries=3
```

- Keep this running in a terminal while testing, or run it under a process manager.
- Alternatively use `php artisan queue:listen` for autoreload during development (slower).

---

## 6) Run worker as a service (production)

Recommended: use Supervisor or a systemd service to run persistent workers.

### Supervisor example (`/etc/supervisor/conf.d/laravel-worker.conf`)

```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/asset-task-sync-backend/artisan queue:work --sleep=3 --tries=3 --timeout=90
autostart=true
autorestart=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/log/laravel-worker.log
stopwaitsecs=3600
```

Commands to enable:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start laravel-worker:*
```

### systemd unit example (`/etc/systemd/system/laravel-worker.service`)

```ini
[Unit]
Description=Laravel Queue Worker
After=network.target

[Service]
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php /path/to/asset-task-sync-backend/artisan queue:work --sleep=3 --tries=3 --timeout=90
TimeoutStopSec=3600
KillMode=process

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable laravel-worker
sudo systemctl start laravel-worker
sudo journalctl -u laravel-worker -f
```

---

## 7) Failed jobs and monitoring

- List failed jobs:
```
php artisan queue:failed
```
- Retry a failed job:
```
php artisan queue:retry {id}
```
- Delete failed jobs:
```
php artisan queue:forget {id}
php artisan queue:flush
```

Check worker logs (`/var/log/laravel-worker.log` or `storage/logs/laravel.log`) for errors.

---

## 8) Testing

- Local test command (provided in repo):

```bash
cd asset-task-sync-backend
php artisan test:email you@example.com
```

- Approve a user from the admin UI — the approval email will be queued and processed by the worker.

---

## 9) Troubleshooting

- If jobs remain in `jobs` table and are not processed, confirm the worker is running and connected to the same queue/DB.
- Check `storage/logs/laravel.log` and `stdout_logfile` for worker errors.
- If emails never arrive or land in spam, verify your mail provider dashboard for delivery status, SPF/DKIM, and set up DMARC.

---

## 10) Deliverability & provider recommendation

For reliable delivery to Gmail and other mailboxes:
- Use a transactional email provider (Mailgun, SendGrid, Amazon SES, Postmark).
- Publish SPF and DKIM DNS records recommended by the provider.
- Add a DMARC record (start with `p=none` for monitoring).
- Use verified sending domain and `MAIL_FROM_ADDRESS` on that domain.

Example Mailgun `.env` entries (again):

```env
MAIL_MAILER=mailgun
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_SECRET=key-...
MAIL_FROM_ADDRESS=no-reply@yourdomain.com
```

---

## 11) Files the assistant modified to enable queue sending

- `app/Mail/AccountApproved.php` (now `ShouldQueue`)
- `app/Http/Controllers/Api/AuthController.php` (approval email now `queue()`)
- `app/Console/Commands/TestEmail.php` (test email queued)

---

If you want, I can also:
- Add a Supervisor config file to the repo (`deploy/`) and a short `systemd` unit example,
- Add a small `README` script for deploy steps,
- Configure a transactional provider (Mailgun/SES) and create exact DNS TXT records for SPF/DKIM.

Tell me which of those you'd like next and I'll prepare it as a file.
