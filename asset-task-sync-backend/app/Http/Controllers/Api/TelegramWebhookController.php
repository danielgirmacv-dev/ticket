<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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

        if (!$message) {
            return response()->json(['ok' => true]);
        }

        $chatId = $message['chat']['id'] ?? null;
        $text = $message['text'] ?? '';
        $username = $message['from']['username'] ?? null;

        // Handle /start command with token
        if (str_starts_with($text, '/start ')) {
            $token = trim(substr($text, 7));

            if ($token) {
                $result = $this->telegramService->verifyAndLinkChatId($token, $chatId, $username);

                // Send response message to user
                $this->telegramService->sendMessage($chatId, $result['message']);

                return response()->json(['ok' => true, 'result' => $result]);
            }
        }

        // Handle plain /start command
        if ($text === '/start') {
            $welcomeMessage = "👋 Welcome to Asset & Ticket Management System!\n\n";
            $welcomeMessage .= "To receive notifications:\n";
            $welcomeMessage .= "1. Log in to the web app\n";
            $welcomeMessage .= "2. Go to Settings → Notifications\n";
            $welcomeMessage .= "3. Click 'Link Telegram Account'\n";
            $welcomeMessage .= "4. Click the link to connect your account\n\n";
            $welcomeMessage .= "You'll receive approval notifications and updates here!";

            $this->telegramService->sendMessage($chatId, $welcomeMessage);
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
            'data' => $linkData
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
                'message' => 'Telegram account unlinked successfully'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to unlink Telegram account'
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
            'linked' => !is_null($profile->telegram_chat_id),
            'username' => $profile->telegram_username,
            'chat_id' => $profile->telegram_chat_id
        ]);
    }
}
