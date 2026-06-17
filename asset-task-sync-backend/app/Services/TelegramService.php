<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use App\Models\User;

class TelegramService
{
    private $botToken;
    private $baseUrl;

    public function __construct()
    {
        $this->botToken = env('TELEGRAM_BOT_TOKEN');
        $this->baseUrl = "https://api.telegram.org/bot{$this->botToken}";
    }

    /**
     * Send a message to a Telegram chat using chat_id
     */
    public function sendMessage($chatId, $message)
    {
        if (!$this->botToken || !$chatId) {
            return false;
        }

        try {
            $response = Http::post("{$this->baseUrl}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => 'Markdown'
            ]);

            if ($response->successful()) {
                Log::info("Telegram message sent successfully to chat_id: {$chatId}");
                return true;
            } else {
                Log::warning("Telegram send failed: " . $response->body());
                return false;
            }
        } catch (\Exception $e) {
            Log::error('Telegram send exception: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send account approval notification
     */
    public function sendApprovalNotification($user)
    {
        $appUrl = env('APP_URL', 'http://localhost:5173');

        $message = "🎉 *Account Approved!*\n\n";
        $message .= "Hello {$user->name},\n\n";
        $message .= "Your account has been approved by the administrator!\n";
        $message .= "You can now log in and submit maintenance requests.\n\n";
        $message .= "🔗 Login: {$appUrl}/auth\n\n";
        $message .= "Have a great day!";

        $telegramChatId = $user->profile->telegram_chat_id ?? null;

        if (!$telegramChatId) {
            Log::info("User {$user->id} has no Telegram chat_id linked");
            return false;
        }

        return $this->sendMessage($telegramChatId, $message);
    }

    /**
     * Generate a unique token for linking Telegram account
     * Returns: ['token' => string, 'deep_link' => string]
     */
    public function generateLinkToken($userId)
    {
        $token = Str::random(32);
        $cacheKey = "telegram_link_token:{$token}";

        // Store token with user_id for 15 minutes
        Cache::put($cacheKey, $userId, now()->addMinutes(15));

        $botUsername = env('TELEGRAM_BOT_USERNAME');
        $deepLink = "https://t.me/{$botUsername}?start={$token}";

        Log::info("Generated Telegram link token for user {$userId}");

        return [
            'token' => $token,
            'deep_link' => $deepLink,
            'expires_at' => now()->addMinutes(15)->toIso8601String()
        ];
    }

    /**
     * Verify token and link chat_id to user
     */
    public function verifyAndLinkChatId($token, $chatId, $username = null)
    {
        $cacheKey = "telegram_link_token:{$token}";
        $userId = Cache::get($cacheKey);

        if (!$userId) {
            Log::warning("Invalid or expired Telegram link token: {$token}");
            return [
                'success' => false,
                'message' => 'Invalid or expired link token. Please generate a new link from the app.'
            ];
        }

        // Find user and update their profile
        $user = User::find($userId);
        if (!$user) {
            Log::error("User not found for Telegram link: {$userId}");
            Cache::forget($cacheKey);
            return [
                'success' => false,
                'message' => 'User account not found.'
            ];
        }

        // Update profile with chat_id and username
        $user->profile->update([
            'telegram_chat_id' => $chatId,
            'telegram_username' => $username
        ]);

        // Delete the used token
        Cache::forget($cacheKey);

        Log::info("Telegram account linked successfully for user {$userId}, chat_id: {$chatId}");

        return [
            'success' => true,
            'message' => "✅ Your Telegram account has been linked successfully!\n\nYou will now receive notifications from the Asset & Ticket Management System.",
            'user' => $user
        ];
    }

    /**
     * Unlink Telegram account from user
     */
    public function unlinkAccount($userId)
    {
        $user = User::find($userId);
        if (!$user) {
            return false;
        }

        $user->profile->update([
            'telegram_chat_id' => null,
            'telegram_username' => null
        ]);

        Log::info("Telegram account unlinked for user {$userId}");
        return true;
    }
}
