<?php

namespace App\Console\Commands;

use App\Models\MaintenanceSchedule;
use App\Models\MaintenanceTicket;
use Illuminate\Console\Command;

class CheckMaintenanceSchedules extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'maintenance:check-schedules';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for due maintenance schedules and create tickets';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for due maintenance schedules...');

        $dueSchedules = MaintenanceSchedule::active()
            ->due()
            ->with('asset')
            ->get();

        if ($dueSchedules->isEmpty()) {
            $this->info('No due schedules found.');
            return 0;
        }

        $ticketsCreated = 0;

        foreach ($dueSchedules as $schedule) {
            // Create maintenance ticket
            $ticket = MaintenanceTicket::create([
                'title' => $schedule->title . ' (Scheduled)',
                'description' => $schedule->description . "\n\nAuto-generated from preventive maintenance schedule.",
                'type' => $schedule->type,
                'asset_id' => $schedule->asset_id,
                'status' => 'submitted',
                'priority' => 'medium',
                'scheduled_date' => now(),
                'is_recurring' => true,
                'requester_id' => $schedule->created_by,
            ]);

            // Update schedule
            $schedule->update([
                'last_run_date' => now(),
                'next_run_date' => $this->calculateNextRunDate($schedule),
            ]);

            $ticketsCreated++;
            $this->info("Created ticket: {$ticket->title} for asset: {$schedule->asset->name}");
        }

        $this->info("Successfully created {$ticketsCreated} maintenance ticket(s).");
        return 0;
    }

    /**
     * Calculate the next run date based on frequency.
     */
    private function calculateNextRunDate(MaintenanceSchedule $schedule)
    {
        return match ($schedule->frequency) {
            'daily' => now()->addDay(),
            'weekly' => now()->addWeek(),
            'monthly' => now()->addMonth(),
            'quarterly' => now()->addMonths(3),
            'yearly' => now()->addYear(),
            default => now()->addMonth(),
        };
    }
}
