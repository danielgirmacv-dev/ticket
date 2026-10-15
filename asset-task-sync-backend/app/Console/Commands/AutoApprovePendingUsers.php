<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\UserApprovalService;
use Illuminate\Console\Command;

class AutoApprovePendingUsers extends Command
{
    protected $signature = 'users:auto-approve-pending';

    protected $description = 'Activate pending self-registrations after the configured wait period';

    public function handle(UserApprovalService $approvalService): int
    {
        $minutes = (int) config('registration.auto_approve_after_minutes');

        if ($minutes <= 0) {
            return self::SUCCESS;
        }

        $cutoff = now()->subMinutes($minutes);

        User::query()
            ->where('status', 'pending')
            ->where('created_at', '<=', $cutoff)
            ->orderBy('id')
            ->each(function (User $user) use ($approvalService) {
                $approvalService->approveIfPending($user->fresh(['profile']));
            });

        return self::SUCCESS;
    }
}
