<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * SmsService — sends SMS through an Ethio Telecom gateway (direct enterprise
 * API) or an Ethio Telecom aggregator/partner, configured via config/services.php.
 *
 * Drivers:
 *  - 'log' (default): messages are written to the Laravel log instead of being
 *    sent. Safe for development — nothing leaves the server.
 *  - 'api': real sending via POST to SMS_API_URL with SMS_AUTH_MODE auth.
 *
 * The JSON body field names and auth style are all configurable so the service
 * works with Ethio Telecom's own API docs as well as partner REST APIs.
 */
class SmsService
{
    /**
     * True when a real sending gateway is configured (SMS_DRIVER=api + SMS_API_URL).
     */
    public function enabled(): bool
    {
        return config('services.sms.driver') === 'api'
            && ! empty(config('services.sms.api_url'));
    }

    /**
     * Send one SMS.
     *
     * Returns true when the message was handed to the gateway (or logged, in
     * the 'log' driver) and false when it was skipped (invalid number, rejected
     * by the provider with a 4xx).
     *
     * Throws on transport / 5xx failures so queued jobs get retried.
     */
    public function send(string $to, string $message): bool
    {
        $phone = $this->normalizePhone($to);
        if (! $phone) {
            Log::warning("[SmsService] SMS skipped — invalid Ethiopian mobile number: {$to}");

            return false;
        }

        if (! $this->enabled()) {
            Log::info("[SmsService] (log driver) to {$phone}: {$message}");

            return true;
        }

        $cfg = config('services.sms');

        $payload = [
            $cfg['to_field']      => $phone,
            $cfg['message_field'] => $message,
        ];

        // Body-based auth (for gateways that expect secret/token in the POST body)
        if (($cfg['auth_mode'] ?? '') === 'body') {
            $secret = $cfg['api_key'] ?? $cfg['auth_header'] ?? null;
            if ($secret) {
                $payload[$cfg['secret_field'] ?? 'secret'] = $secret;
            }
        }

        if (! empty($cfg['sender_id'])) {
            $payload[$cfg['sender_field']] = $cfg['sender_id'];
        }

        if (! empty($cfg['device_id'])) {
            $payload[$cfg['device_field'] ?? 'device'] = $cfg['device_id'];
        }

        if (! empty($cfg['mode'])) {
            $payload['mode'] = $cfg['mode'];
        }

        if (! empty($cfg['sim'])) {
            $payload['sim'] = $cfg['sim'];
        }

        $payload = array_filter($payload, fn ($value) => $value !== null && $value !== '');

        $request = Http::timeout(10)->acceptJson();

        $request = match ($cfg['auth_mode']) {
            'basic'  => $request->withBasicAuth($cfg['username'] ?? '', $cfg['password'] ?? ''),
            'header' => $request->withHeaders([$cfg['auth_header'] => $cfg['api_key']]),
            'bearer' => $request->withToken($cfg['api_key'] ?? ''),
            default  => $request,
        };

        try {
            $isForm = ($cfg['content_type'] ?? 'form') === 'form';
            $response = $isForm
                ? $request->asForm()->post($cfg['api_url'], $payload)
                : $request->post($cfg['api_url'], $payload);
        } catch (\Throwable $e) {
            // Connection error — let the queued job retry.
            throw new \RuntimeException('SMS gateway unreachable: '.$e->getMessage(), 0, $e);
        }

        if ($response->successful()) {
            $body = $response->json();
            // Handle gateways that return HTTP 200 with an internal error status (e.g. {"status":400, "message":"..."})
            if (is_array($body) && isset($body['status']) && (int) $body['status'] !== 200) {
                $msg = $body['message'] ?? 'Gateway returned error status '.$body['status'];
                Log::error("[SmsService] SMS rejected by gateway ({$body['status']}): {$msg}");

                return false;
            }

            Log::info("[SmsService] SMS sent to {$phone}");

            return true;
        }

        if ($response->clientError()) {
            // 4xx: our request is wrong (bad number, bad key, bad sender ID) —
            // retrying won't help, so log it and skip.
            Log::error("[SmsService] SMS rejected by gateway ({$response->status()}): ".Str::limit($response->body(), 500));

            return false;
        }

        // 5xx: possibly transient — throw so the queued job retries with backoff.
        throw new \RuntimeException("SMS gateway error ({$response->status()}): ".Str::limit($response->body(), 300));
    }

    /**
     * Normalize an Ethiopian mobile number to international format
     * (2519XXXXXXXX / 2517XXXXXXXX — Ethio Telecom 09x and Safaricom 07x).
     *
     * Accepts: "0912345678", "912345678", "+251912345678", "251912345678",
     * with spaces, dashes or parentheses. Returns null when invalid.
     */
    public function normalizePhone(?string $phone): ?string
    {
        if (! $phone) {
            return null;
        }

        $digits = preg_replace('/[^\d]/', '', $phone);

        if (str_starts_with($digits, '251')) {
            $international = $digits;
        } elseif (str_starts_with($digits, '0')) {
            $international = '251'.substr($digits, 1);
        } else {
            $international = '251'.$digits;
        }

        return preg_match('/^251[79]\d{8}$/', $international) ? $international : null;
    }
}
