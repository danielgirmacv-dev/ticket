Deployment helpers: Supervisor & systemd

This `deploy/` folder contains example configs for running Laravel queue workers in production.

Files
- `supervisor/laravel-worker.conf` — example Supervisor program config.
- `systemd/laravel-worker.service` — example systemd unit.

Instructions

1) Choose one method (Supervisor OR systemd). Don't use both for the same worker.

2) Edit files and replace `/path/to/asset-task-sync-backend` with the absolute path of the backend repo on the server.

Supervisor (example)

- Copy the file to Supervisor config directory:

```bash
sudo cp deploy/supervisor/laravel-worker.conf /etc/supervisor/conf.d/laravel-worker.conf
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start laravel-worker:*
```

- View worker logs (file configured in the conf):

```bash
tail -f /var/log/laravel-worker.log
```

systemd (example)

- Copy the unit and enable:

```bash
sudo cp deploy/systemd/laravel-worker.service /etc/systemd/system/laravel-worker.service
sudo systemctl daemon-reload
sudo systemctl enable --now laravel-worker
sudo journalctl -u laravel-worker -f
```

3) Recommended production settings
- Use `QUEUE_CONNECTION=redis` in your `.env` and run Redis on the server.
- Use a transactional mail provider (Mailgun, SES, Postmark) and configure DKIM/SPF for your sending domain.
- Run `php artisan config:cache` and `php artisan route:cache` after deploy.
- Restart workers after deploy: `php artisan queue:restart`.

4) cPanel / shared hosting (no Supervisor, no systemd)

This app deploys to cPanel shared hosting (`public/setup.php`), where you cannot run a
persistent worker. Ticket notifications (submit/approve/reject/assign) are queued
(`ShouldQueue`), so without a worker they pile up in the `jobs` table and are never sent.
Run the worker from cron instead — in cPanel → Cron Jobs, add:

```
* * * * * cd /home/USER/public_html/api && php artisan queue:work --stop-when-empty --max-time=50 >> storage/logs/queue-cron.log 2>&1
```

- `--stop-when-empty` makes the process exit after draining the queue, so cron starts a
  fresh worker every minute without piling up processes.
- Replace the path with the real backend path (the folder containing `artisan`).
- Optional safety net while no worker exists: `QUEUE_CONNECTION=sync` runs jobs inline,
  slower but never loses notifications.

5) Troubleshooting
- If jobs are queued but not processed, ensure the worker is running under the same user and environment as your app.
- Check `storage/logs/laravel.log` and `journalctl` or `stdout_logfile` for errors.
- Check the `jobs` table row count: `SELECT COUNT(*) FROM jobs;` — if it grows, the worker/cron is not running.

If you want, I can also add a small `deploy/scripts` helper (copy-and-enable script) to the repo — ask and I'll add it.