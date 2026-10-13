<?php

namespace App\Jobs;

use App\Models\MaintenanceTicket;
use App\Models\Notification;
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

        // --- Notify Technician ---
        try {
            Notification::create([
                'user_id' => $technicianProfile->user_id,
                'title'   => 'New Ticket Assigned',
                'message' => "You have been assigned to ticket '{$this->ticket->title}'.",
                'type'    => 'info',
                'link'    => "/tickets/{$this->ticket->id}",
                'is_read' => false,
            ]);
        } catch (\Exception $e) {
            Log::error('Notification create failed (technician): ' . $e->getMessage());
        }

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

        try {
            Notification::create([
                'user_id' => $this->ticket->requester->user_id,
                'title'   => 'Technician Assigned',
                'message' => "A technician has been assigned to your ticket '{$this->ticket->title}'.",
                'type'    => 'info',
                'link'    => "/tickets/{$this->ticket->id}",
                'is_read' => false,
            ]);
        } catch (\Exception $e) {
            Log::error('Notification create failed (requester): ' . $e->getMessage());
        }

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
