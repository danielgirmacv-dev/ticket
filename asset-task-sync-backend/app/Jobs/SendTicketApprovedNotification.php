<?php

namespace App\Jobs;

use App\Models\MaintenanceTicket;
use App\Models\User;
use App\Services\TelegramService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendTicketApprovedNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        public MaintenanceTicket $ticket,
        public string $approverName,
    ) {}

    public function handle(TelegramService $telegram): void
    {
        $this->ticket->load('requester');

        if (! $this->ticket->requester?->user_id) {
            return;
        }

        $userId = $this->ticket->requester->user_id;

        // Telegram notification (in-app DB notification handled synchronously by NotificationService)
        try {
            $requester = User::find($userId);
            $chatId = $requester?->profile?->telegram_chat_id ?? null;
            if ($chatId) {
                $telegram->sendMessage($chatId,
                    "✅ *Ticket Approved!*\n\n"
                    . "*#{$this->ticket->id}* — {$this->ticket->title}\n"
                    . "Your request has been approved. A technician will be assigned shortly.\n"
                    . "Approved by: {$this->approverName}"
                );
            }
        } catch (\Exception $e) {
            Log::warning('Telegram send failed (approved): ' . $e->getMessage());
        }
    }

    public function failed(\Throwable $e): void
    {
        Log::error("SendTicketApprovedNotification failed for Ticket #{$this->ticket->id}: {$e->getMessage()}");
    }
}
