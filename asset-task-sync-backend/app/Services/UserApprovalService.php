<?php

namespace App\Services;

use App\Http\Controllers\Api\MaintenanceTicketController;
use App\Mail\AccountApproved;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class UserApprovalService
{
    public function approveIfPending(User $user): bool
    {
        if ($user->status !== 'pending') {
            return false;
        }

        $user->update(['status' => 'active']);
        MaintenanceTicketController::forgetRoutingCache();
        $this->notifyApproved($user);

        return true;
    }

    public function notifyApproved(User $user): void
    {
        try {
            Notification::create([
                'user_id' => $user->id,
                'title' => 'Account Approved',
                'message' => 'Your account has been approved. You can sign in now.',
                'type' => 'success',
                'link' => '/auth',
                'is_read' => false,
            ]);

            $user->loadMissing('profile');

            if ($user->profile?->telegram_username) {
                (new TelegramService)->sendApprovalNotification($user);
            }

            Mail::to($user->email)->queue(new AccountApproved($user));
        } catch (\Throwable $e) {
            Log::error('Failed to notify user of approval: '.$e->getMessage());
        }
    }

    public static function registrationPendingMessage(): string
    {
        $minutes = (int) config('registration.auto_approve_after_minutes');
        $support = config('registration.support_email');

        if ($minutes > 0) {
            return "Thank you for registering. A manager may approve your account shortly. "
                ."If no manager is available, access is granted automatically within about {$minutes} minutes. "
                ."We will email you at the address you provided when you can sign in. "
                ."For urgent access, contact {$support}.";
        }

        return "Thank you for registering. Your account is pending manager approval. "
            ."You will receive an email when you can sign in. "
            ."For urgent access, contact {$support}.";
    }
}
