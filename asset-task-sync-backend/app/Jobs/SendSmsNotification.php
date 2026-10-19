<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\SmsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Generic queued SMS to a user's profile phone number.
 *
 * Network I/O to the SMS gateway happens here (queue), never during an
 * HTTP request. Users without a phone number are skipped silently.
 */
class SendSmsNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        public int $userId,
        public string $message,
    ) {}

    public function handle(SmsService $sms): void
    {
        $user = User::find($this->userId);
        if (! $user) {
            return;
        }

        $phone = $user->profile?->phone ?? null;
        if (! $phone) {
            Log::info("SMS skipped for user {$this->userId}: no phone number on profile.");

            return;
        }

        // Throws on gateway/network failure → retried up to $tries times.
        $sms->send($phone, $this->message);
    }

    public function failed(\Throwable $e): void
    {
        Log::error("SendSmsNotification failed for user {$this->userId}: {$e->getMessage()}");
    }
}
