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
        $this->ticket->load(['requester', 'assignedManager', 'assignedTechnician']);
        $notifiedChatIds = [];

        $notifyProfile = function (?Profile $profile, string $message) use ($telegram, &$notifiedChatIds): void {
            if (! $profile?->telegram_chat_id) {
                return;
            }
            if (in_array($profile->telegram_chat_id, $notifiedChatIds, true)) {
                return;
            }
            $notifiedChatIds[] = $profile->telegram_chat_id;

            try {
                $telegram->sendMessage($profile->telegram_chat_id, $message);
            } catch (\Exception $e) {
                Log::warning('Telegram send failed (approved): ' . $e->getMessage());
            }
        };

        // Requester
        $notifyProfile($this->ticket->requester,
            "✅ *Ticket Approved!*\n\n"
            . "*#{$this->ticket->id}* — {$this->ticket->title}\n"
            . "Your request has been approved. A technician will be assigned shortly.\n"
            . "Approved by: {$this->approverName}"
        );

        // Assigned manager
        if ($this->ticket->assignedManager && $this->ticket->assignedManager->id !== ($this->ticket->requester?->id ?? null)) {
            $notifyProfile($this->ticket->assignedManager,
                "✅ *Ticket Approved — Routed to You*\n\n"
                . "*#{$this->ticket->id}* — {$this->ticket->title}\n"
                . "The ticket you manage has been approved.\n"
                . "Approved by: {$this->approverName}"
            );
        }

        // Assigned technician
        if ($this->ticket->assignedTechnician
            && $this->ticket->assignedTechnician->id !== ($this->ticket->requester?->id ?? null)
            && $this->ticket->assignedTechnician->id !== ($this->ticket->assignedManager?->id ?? null)) {
            $notifyProfile($this->ticket->assignedTechnician,
                "🔧 *Ticket Approved — You Can Start Working*\n\n"
                . "*#{$this->ticket->id}* — {$this->ticket->title}\n"
                . "This ticket has been approved and assigned to you. Please log in to start working.\n"
                . "Approved by: {$this->approverName}"
            );
        }
    }

    public function failed(\Throwable $e): void
    {
        Log::error("SendTicketApprovedNotification failed for Ticket #{$this->ticket->id}: {$e->getMessage()}");
    }
}
