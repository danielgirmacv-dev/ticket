<?php

namespace App\Console\Commands;

use App\Models\MaintenanceTicket;
use App\Services\ActivityLogger;
use Illuminate\Console\Command;
use Carbon\Carbon;

class AutoCloseTicketsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tickets:auto-close';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically close tickets that have been pending review for more than 3 days';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for tickets to auto-close...');

        // Find tickets that are pending review and completed more than 3 days ago
        $threeDaysAgo = Carbon::now()->subDays(3);

        $ticketsToClose = MaintenanceTicket::where('status', 'completed_pending_review')
            ->where('completed_date', '<=', $threeDaysAgo)
            ->get();

        if ($ticketsToClose->isEmpty()) {
            $this->info('No tickets found to auto-close.');
            return 0;
        }

        $count = 0;
        foreach ($ticketsToClose as $ticket) {
            $ticket->update([
                'status' => 'completed',
                'notes' => ($ticket->notes ?? '') . "\n\n[Auto-closed after 3 days without requester verification]",
            ]);

            ActivityLogger::log(
                'auto_closed',
                'Ticket',
                $ticket->id,
                "Auto-closed ticket: {$ticket->title} (pending review for 3+ days)"
            );

            $count++;
            $this->line("✓ Auto-closed ticket: {$ticket->title} (ID: {$ticket->id})");
        }

        $this->info("Successfully auto-closed {$count} ticket(s).");
        return 0;
    }
}
