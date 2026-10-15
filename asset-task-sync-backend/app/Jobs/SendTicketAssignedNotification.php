<?php

namespace App\Jobs;

use App\Models\MaintenanceTicket;
use App\Models\Profile;
use App\Models\User;
use App\Services\TelegramService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendTicketAssignedNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        public MaintenanceTicket $ticket,
        public string $technicianProfileId,  // UUID of the Profile
    ) {}

    public function handle(TelegramService $telegram): void
    {
        $this->ticket->load('requester');

        $technicianProfile = Profile::find($this->technicianProfileId);

        if (! $technicianProfile?->user_id) {
            return;
        }

        // --- Telegram: Technician ---
        // (in-app DB notification handled synchronously by NotificationService)
        try {
            $technicianUser = User::find($technicianProfile->user_id);
            $chatId = $technicianUser?->profile?->telegram_chat_id ?? null;
            if ($chatId) {
                $telegram->sendMessage($chatId,
                    "🔧 *Ticket Assigned to You*\n\n"
                    . "*#{$this->ticket->id}* — {$this->ticket->title}\n"
                    . "Submitted by: {$this->ticket->requester?->name}\n"
                    . "Priority: " . strtoupper($this->ticket->priority ?? 'medium') . "\n"
                    . "Scheduled: {$this->ticket->scheduled_date}\n\n"
                    . "Please log in to start working on this ticket."
                );
            }
        } catch (\Exception $e) {
            Log::warning('Telegram send failed (technician assigned): ' . $e->getMessage());
        }

        // --- Also notify Requester ---
        if (! $this->ticket->requester?->user_id) {
            return;
        }

        // --- Telegram: Requester ---
        try {
            $requesterUser = User::find($this->ticket->requester->user_id);
            $chatId = $requesterUser?->profile?->telegram_chat_id ?? null;
            if ($chatId) {
                $telegram->sendMessage($chatId,
                    "👨‍🔧 *Technician Assigned*\n\n"
                    . "*#{$this->ticket->id}* — {$this->ticket->title}\n"
                    . "Technician: {$technicianProfile->name}\n"
                    . "Your request is being handled. You'll be notified on completion."
                );
            }
        } catch (\Exception $e) {
            Log::warning('Telegram send failed (requester assigned): ' . $e->getMessage());
        }
    }

    public function failed(\Throwable $e): void
    {
        Log::error("SendTicketAssignedNotification failed for Ticket #{$this->ticket->id}: {$e->getMessage()}");
    }
}
