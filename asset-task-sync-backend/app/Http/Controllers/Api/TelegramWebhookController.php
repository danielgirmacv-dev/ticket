<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Services\TelegramService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TelegramWebhookController extends Controller
{
    private $telegramService;

    public function __construct(TelegramService $telegramService)
    {
        $this->telegramService = $telegramService;
    }

    /**
     * Handle incoming Telegram webhook messages
     */
    public function webhook(Request $request)
    {
        $update = $request->all();

        Log::info('Telegram webhook received', ['update' => $update]);

        // Extract message data
        $message = $update['message'] ?? null;

        if (! $message) {
            return response()->json(['ok' => true]);
        }

        $chatId = $message['chat']['id'] ?? null;
        $text = trim($message['text'] ?? '');
        $username = $message['from']['username'] ?? null;

        if (! $chatId) {
            return response()->json(['ok' => true]);
        }

        // Handle /start command with token (from Settings page deep link)
        if (str_starts_with($text, '/start ')) {
            $token = trim(substr($text, 7));

            if ($token) {
                $result = $this->telegramService->verifyAndLinkChatId($token, $chatId, $username);

                // Send response message to user
                $this->telegramService->sendMessage($chatId, $result['message']);

                return response()->json(['ok' => true, 'result' => $result]);
            }
        }

        // Handle plain /start or username-based matching
        if ($text === '/start' || str_starts_with($text, '/start')) {
            if ($username) {
                $cleanUsername = ltrim(strtolower($username), '@');

                // Look up profile matching the telegram username (case-insensitive, ignoring @)
                $profile = Profile::with('user')
                    ->whereRaw("REPLACE(LOWER(telegram_username), '@', '') = ?", [$cleanUsername])
                    ->first();

                if ($profile) {
                    $profile->update([
                        'telegram_chat_id' => $chatId,
                        'telegram_username' => $username,
                    ]);

                    $isPending = $profile->user && $profile->user->status === 'pending';

                    $msg = "✅ *Telegram Connected Successfully!*\n\n";
                    $msg .= "Hello *{$profile->name}*, your Telegram account has been linked to your profile.\n\n";

                    if ($isPending) {
                        $msg .= "⏳ *Status:* Your registration is currently awaiting administrator approval.\n\n";
                        $msg .= "You will receive an instant notification right here as soon as your account is approved! 🎉";
                    } else {
                        $msg .= "🔔 You will now receive notifications here for approvals, ticket updates, and technician assignments.";
                    }

                    $this->telegramService->sendMessage($chatId, $msg);
                    Log::info("Telegram auto-linked by username '{$username}' to profile ID {$profile->id}, chat_id: {$chatId}");

                    return response()->json(['ok' => true]);
                }
            }

            // Fallback welcome message if username not yet found
            $welcomeMessage = "👋 *Welcome to Asset & Ticket Management System!*\n\n";
            if ($username) {
                $welcomeMessage .= "We detected your Telegram username: *@{$username}*.\n\n";
                $welcomeMessage .= "• If you just registered, make sure your registration profile used *@{$username}*.\n";
                $welcomeMessage .= "• Once an administrator links or registers your account, you'll receive notifications here.\n";
                $welcomeMessage .= "• If already active, log in and visit *Settings → Notifications* to link.";
            } else {
                $welcomeMessage .= "To receive notifications:\n";
                $welcomeMessage .= "1. Set a public username in your Telegram Settings\n";
                $welcomeMessage .= "2. Make sure it matches the Telegram username in your registration\n";
                $welcomeMessage .= "3. Or log in to the web app and connect via *Settings → Notifications*.";
            }

            $this->telegramService->sendMessage($chatId, $welcomeMessage);
            return response()->json(['ok' => true]);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Generate a new link token for user
     */
    public function generateLink(Request $request)
    {
        $user = $request->user();

        $linkData = $this->telegramService->generateLinkToken($user->id);

        return response()->json([
            'success' => true,
            'data' => $linkData,
        ]);
    }

    /**
     * Unlink Telegram account
     */
    public function unlink(Request $request)
    {
        $user = $request->user();

        $success = $this->telegramService->unlinkAccount($user->id);

        if ($success) {
            return response()->json([
                'success' => true,
                'message' => 'Telegram account unlinked successfully',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to unlink Telegram account',
        ], 500);
    }

    /**
     * Get Telegram link status
     */
    public function status(Request $request)
    {
        $user = $request->user();
        $profile = $user->profile;

        return response()->json([
            'success' => true,
            'linked' => ! is_null($profile->telegram_chat_id),
            'username' => $profile->telegram_username,
            'chat_id' => $profile->telegram_chat_id,
        ]);
    }
}
