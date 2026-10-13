<?php

namespace App\Jobs;

use App\Models\MaintenanceTicket;
use App\Models\Notification;
use App\Models\User;
use App\Services\TelegramService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendTicketSubmittedNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        public MaintenanceTicket $ticket,
        public ?int $assignedManagerId,   // User ID of the manager (not profile ID)
        public string $categoryLabel,
        public int $submittedByUserId,
    ) {}

    public function handle(TelegramService $telegram): void
    {
        $this->ticket->load('requester');

        // --- Notify assigned manager ---
        if ($this->assignedManagerId && $this->assignedManagerId !== $this->submittedByUserId) {
            $this->createNotification(
                $this->assignedManagerId,
                "New {$this->categoryLabel} Request",
                "A new {$this->categoryLabel} ticket '{$this->ticket->title}' has been routed to you.",
                'info',
                "/tickets/{$this->ticket->id}"
            );

            $manager = User::find($this->assignedManagerId);
            $this->sendTelegram($telegram, $manager,
                "📋 *New {$this->categoryLabel} Ticket Submitted*\n\n"
                . "*#{$this->ticket->id}* — {$this->ticket->title}\n"
                . "Submitted by: {$this->ticket->requester?->name}\n"
                . "Priority: " . strtoupper($this->ticket->priority ?? 'medium') . "\n\n"
                . "Please log in to review and approve."
            );
        }

        // --- Notify super_admins (oversight) ---
        User::role('super_admin')->each(function ($superAdmin) use ($telegram) {
            if ($superAdmin->id === $this->submittedByUserId) return;
            if ($this->assignedManagerId && $superAdmin->id === $this->assignedManagerId) return;

            $this->createNotification(
                $superAdmin->id,
                'New Maintenance Request',
                "Ticket '{$this->ticket->title}' submitted — routed to assigned manager.",
                'info',
                "/tickets/{$this->ticket->id}"
            );

            $this->sendTelegram($telegram, $superAdmin,
                "📋 *New Ticket Submitted*\n\n"
                . "*#{$this->ticket->id}* — {$this->ticket->title}\n"
                . "Submitted by: {$this->ticket->requester?->name}\n"
                . "Priority: " . strtoupper($this->ticket->priority ?? 'medium')
            );
        });
    }

    private function createNotification($userId, $title, $message, $type, $link = null): void
    {
        try {
            Notification::create([
                'user_id'  => $userId,
                'title'    => $title,
                'message'  => $message,
                'type'     => $type,
                'link'     => $link,
                'is_read'  => false,
            ]);
        } catch (\Exception $e) {
            Log::error('Notification create failed: ' . $e->getMessage());
        }
    }

    private function sendTelegram(TelegramService $telegram, ?User $user, string $message): void
    {
        try {
            $chatId = $user?->profile?->telegram_chat_id ?? null;
            if ($chatId) {
                $telegram->sendMessage($chatId, $message);
            }
        } catch (\Exception $e) {
            Log::warning('Telegram send failed: ' . $e->getMessage());
        }
    }

    public function failed(\Throwable $e): void
    {
        Log::error("SendTicketSubmittedNotification failed for Ticket #{$this->ticket->id}: {$e->getMessage()}");
    }
}
