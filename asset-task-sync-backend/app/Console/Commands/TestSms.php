<?php

namespace App\Console\Commands;

use App\Services\SmsService;
use Illuminate\Console\Command;

class TestSms extends Command
{
    protected $signature = 'test:sms
        {phone : Recipient in local (09..) or international (251..) format}
        {message : SMS text}';

    protected $description = 'Send a test SMS through the configured SMS gateway';

    public function handle(SmsService $sms): int
    {
        $phone = $this->argument('phone');
        $message = $this->argument('message');

        $normalized = $sms->normalizePhone($phone);
        if (! $normalized) {
            $this->error("❌ Invalid Ethiopian mobile number: {$phone}");

            return self::FAILURE;
        }

        $this->info(($sms->enabled() ? 'Sending' : 'Logging (SMS_DRIVER=log)')." SMS to: {$normalized}");

        try {
            $sms->send($normalized, $message);

            $this->info('✅ SMS sent successfully!');

            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('❌ Failed to send SMS: '.$e->getMessage());

            return self::FAILURE;
        }
    }
}
