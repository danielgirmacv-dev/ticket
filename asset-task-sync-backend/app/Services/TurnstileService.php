<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TurnstileService
{
    public static function enabled(): bool
    {
        return filled(config('services.turnstile.secret_key'));
    }

    public static function verify(?string $token, ?string $remoteIp = null): bool
    {
        if (! self::enabled()) {
            return true;
        }

        if (empty($token)) {
            return false;
        }

        try {
            $response = Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                'secret' => config('services.turnstile.secret_key'),
                'response' => $token,
            ]);

            if (! $response->successful()) {
                Log::warning('Turnstile verification HTTP error', ['status' => $response->status()]);

                return false;
            }

            return (bool) $response->json('success');
        } catch (\Throwable $e) {
            Log::error('Turnstile verification failed: '.$e->getMessage());

            return false;
        }
    }
}
