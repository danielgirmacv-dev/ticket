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

/**
 * Sends Telegram notifications only — in-app DB notifications are handled
 * synchronously by NotificationService before this job is dispatched.
 */
class SendTicketSubmittedNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        public MaintenanceTicket $ticket,
        public ?int $assignedManagerId,
        public string $categoryLabel,
        public int $submittedByUserId,
    ) {}

    public function handle(TelegramService $telegram): void
    {
        $this->ticket->load('requester');

        // --- Telegram: assigned manager ---
        if ($this->assignedManagerId && $this->assignedManagerId !== $this->submittedByUserId) {
            $manager = User::find($this->assignedManagerId);
            $this->sendTelegram($telegram, $manager,
                "📋 *New {$this->categoryLabel} Ticket Submitted*\n\n"
                . "*#{$this->ticket->id}* — {$this->ticket->title}\n"
                . "Submitted by: {$this->ticket->requester?->name}\n"
                . "Priority: " . strtoupper($this->ticket->priority ?? 'medium') . "\n\n"
                . "Please log in to review and approve."
            );
        }

        // --- Telegram: super_admins ---
        User::role('super_admin')->each(function ($superAdmin) use ($telegram) {
            if ($superAdmin->id === $this->submittedByUserId) return;

            $this->sendTelegram($telegram, $superAdmin,
                "📋 *New Ticket Submitted*\n\n"
                . "*#{$this->ticket->id}* — {$this->ticket->title}\n"
                . "Submitted by: {$this->ticket->requester?->name}\n"
                . "Priority: " . strtoupper($this->ticket->priority ?? 'medium')
            );
        });
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
