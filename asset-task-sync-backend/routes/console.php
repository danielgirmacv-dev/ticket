<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Auto-close tickets that have been pending review for 3+ days
Schedule::command('tickets:auto-close')->daily();

// Self-registration: auto-activate if still pending after N minutes (see config/registration.php)
Schedule::command('users:auto-approve-pending')->everyMinute();
