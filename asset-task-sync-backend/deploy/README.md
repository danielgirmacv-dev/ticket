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

4) Troubleshooting
- If jobs are queued but not processed, ensure the worker is running under the same user and environment as your app.
- Check `storage/logs/laravel.log` and `journalctl` or `stdout_logfile` for errors.

If you want, I can also add a small `deploy/scripts` helper (copy-and-enable script) to the repo — ask and I'll add it.