<?php

namespace App\Services;

use App\Jobs\SendSmsNotification;
use App\Models\MaintenanceTicket;
use App\Models\Notification;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * NotificationService — creates in-app (DB) notifications synchronously.
 *
 * WHY: Queued jobs (ShouldQueue) only run when a queue worker is active.
 * If production uses QUEUE_CONNECTION=database with no worker, in-app
 * notifications would never appear. This service bypasses the queue
 * entirely for DB writes, so notifications are always immediate.
 *
 * Telegram messages and SMS (network I/O) still go through the queue jobs.
 */
class NotificationService
{
    // -------------------------------------------------------------------------
    // Generic helper
    // -------------------------------------------------------------------------

    /**
     * Queue an SMS for a user (sent to profiles.phone by the queued job).
     * Safe to call anywhere — the gateway call never blocks the request.
     */
    public static function sms(int $userId, string $message): void
    {
        try {
            SendSmsNotification::dispatch($userId, $message);
        } catch (\Exception $e) {
            Log::error('[NotificationService] SMS dispatch failed: '.$e->getMessage());
        }
    }

    public static function create(
        int $userId,
        string $title,
        string $message,
        string $type = 'info',
        ?string $link = null,
    ): void {
        try {
            // Deduplication guard: ignore identical notification sent to the same user within the last 60 seconds
            $recentDuplicate = Notification::where('user_id', $userId)
                ->where('title', $title)
                ->where('created_at', '>=', now()->subSeconds(60))
                ->where(function ($q) use ($message, $link) {
                    $q->where('message', $message);
                    if ($link) {
                        $q->orWhere('link', $link);
                    }
                })
                ->exists();

            if ($recentDuplicate) {
                return;
            }

            Notification::create([
                'user_id' => $userId,
                'title'   => $title,
                'message' => $message,
                'type'    => $type,
                'link'    => $link,
                'is_read' => false,
            ]);
        } catch (\Exception $e) {
            Log::error('[NotificationService] create failed: ' . $e->getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // Ticket submitted — notifies assigned manager + all super_admins
    // -------------------------------------------------------------------------

    public static function ticketSubmitted(
        MaintenanceTicket $ticket,
        ?int $assignedManagerUserId,
        string $categoryLabel,
        int $submittedByUserId,
    ): void {
        $ticket->loadMissing('requester');

        // Notify assigned manager
        if ($assignedManagerUserId && $assignedManagerUserId !== $submittedByUserId) {
            self::create(
                $assignedManagerUserId,
                "New {$categoryLabel} Request",
                "A new {$categoryLabel} ticket '{$ticket->title}' has been routed to you.",
                'info',
                "/tickets/{$ticket->id}",
            );

            self::sms(
                $assignedManagerUserId,
                "EEC IT: New {$categoryLabel} ticket #{$ticket->id} - {$ticket->title} ("
                .strtoupper($ticket->priority ?? 'medium').") has been routed to you. Please log in to review.",
            );
        }

        // Notify ALL super_admins (oversight) — unless they submitted it or are the assigned manager
        User::role('super_admin')->each(function ($superAdmin) use ($ticket, $submittedByUserId, $assignedManagerUserId) {
            if ($superAdmin->id === $submittedByUserId) return;
            if ($superAdmin->id === $assignedManagerUserId) return; // Prevent duplicate notification

            self::create(
                $superAdmin->id,
                'New Maintenance Request',
                "Ticket '{$ticket->title}' submitted — routed to assigned manager.",
                'info',
                "/tickets/{$ticket->id}",
            );

            self::sms(
                $superAdmin->id,
                "EEC IT: Ticket #{$ticket->id} - {$ticket->title} submitted and routed to the assigned manager.",
            );
        });
    }

    // -------------------------------------------------------------------------
    // Ticket approved — notifies requester
    // -------------------------------------------------------------------------

    public static function ticketApproved(MaintenanceTicket $ticket): void
    {
        $ticket->loadMissing('requester');

        $userId = $ticket->requester?->user_id;
        if (! $userId) return;

        self::create(
            $userId,
            'Ticket Approved',
            "Your ticket '{$ticket->title}' has been approved.",
            'success',
            "/tickets/{$ticket->id}",
        );

        self::sms(
            $userId,
            "EEC IT: Your ticket #{$ticket->id} - {$ticket->title} has been approved. A technician will be assigned shortly.",
        );
    }

    // -------------------------------------------------------------------------
    // Ticket rejected — notifies requester
    // -------------------------------------------------------------------------

    public static function ticketRejected(MaintenanceTicket $ticket, string $reason): void
    {
        $ticket->loadMissing('requester');

        $userId = $ticket->requester?->user_id;
        if (! $userId) return;

        self::create(
            $userId,
            'Ticket Rejected',
            "Your ticket '{$ticket->title}' was rejected. Reason: {$reason}",
            'error',
            "/tickets/{$ticket->id}",
        );

        self::sms(
            $userId,
            "EEC IT: Your ticket #{$ticket->id} - {$ticket->title} was rejected. Reason: {$reason}",
        );
    }

    // -------------------------------------------------------------------------
    // Ticket assigned — notifies technician + requester
    // -------------------------------------------------------------------------

    public static function ticketAssigned(MaintenanceTicket $ticket, string $technicianProfileId): void
    {
        $ticket->loadMissing('requester');

        $technicianProfile = Profile::find($technicianProfileId);
        if (! $technicianProfile?->user_id) return;

        // Notify technician
        self::create(
            $technicianProfile->user_id,
            'New Ticket Assigned',
            "You have been assigned to ticket '{$ticket->title}'.",
            'info',
            "/tickets/{$ticket->id}",
        );

        self::sms(
            $technicianProfile->user_id,
            "EEC IT: You have been assigned ticket #{$ticket->id} - {$ticket->title} ("
            .strtoupper($ticket->priority ?? 'medium')."). Scheduled: {$ticket->scheduled_date}. Log in to start.",
        );

        // Notify requester
        $requesterUserId = $ticket->requester?->user_id;
        if ($requesterUserId) {
            self::create(
                $requesterUserId,
                'Technician Assigned',
                "A technician has been assigned to your ticket '{$ticket->title}'.",
                'info',
                "/tickets/{$ticket->id}",
            );

            self::sms(
                $requesterUserId,
                "EEC IT: A technician has been assigned to your ticket #{$ticket->id} - {$ticket->title}.",
            );
        }
    }

    // -------------------------------------------------------------------------
    // Ticket completed (pending review) — notifies manager + super_admins
    // -------------------------------------------------------------------------

    public static function ticketCompletedPendingReview(
        MaintenanceTicket $ticket,
        int $completedByUserId,
    ): void {
        $ticket->loadMissing('requester', 'assignedManager');

        // Notify manager
        $managerUserId = $ticket->assignedManager?->user_id;
        if ($managerUserId && $managerUserId !== $completedByUserId) {
            self::create(
                $managerUserId,
                'Ticket Ready for Review',
                "Ticket '{$ticket->title}' has been marked complete and needs your review.",
                'info',
                "/tickets/{$ticket->id}",
            );

            self::sms(
                $managerUserId,
                "EEC IT: Ticket #{$ticket->id} - {$ticket->title} has been marked complete and needs your review.",
            );
        }

        // Notify super_admins (oversight) — unless they completed it or are the assigned manager
        User::role('super_admin')->each(function ($sa) use ($ticket, $completedByUserId, $managerUserId) {
            if ($sa->id === $completedByUserId) return;
            if ($sa->id === $managerUserId) return; // Prevent duplicate
            self::create(
                $sa->id,
                'Ticket Completed (Pending Review)',
                "Ticket '{$ticket->title}' has been marked as completed and is pending review.",
                'info',
                "/tickets/{$ticket->id}",
            );

            self::sms(
                $sa->id,
                "EEC IT: Ticket #{$ticket->id} - {$ticket->title} is complete and pending review.",
            );
        });
    }

    // -------------------------------------------------------------------------
    // Ticket reopened — notifies manager + super_admins
    // -------------------------------------------------------------------------

    public static function ticketReopened(
        MaintenanceTicket $ticket,
        int $reopenedByUserId,
    ): void {
        $ticket->loadMissing('assignedManager');

        $managerUserId = $ticket->assignedManager?->user_id;
        if ($managerUserId && $managerUserId !== $reopenedByUserId) {
            self::create(
                $managerUserId,
                'Ticket Reopened',
                "Ticket '{$ticket->title}' has been reopened and needs attention.",
                'warning',
                "/tickets/{$ticket->id}",
            );

            self::sms(
                $managerUserId,
                "EEC IT: Ticket #{$ticket->id} - {$ticket->title} has been reopened and needs attention.",
            );
        }

        User::role('super_admin')->each(function ($sa) use ($ticket, $reopenedByUserId, $managerUserId) {
            if ($sa->id === $reopenedByUserId) return;
            if ($sa->id === $managerUserId) return; // Prevent duplicate
            self::create(
                $sa->id,
                'Ticket Reopened',
                "Ticket '{$ticket->title}' has been reopened.",
                'warning',
                "/tickets/{$ticket->id}",
            );

            self::sms(
                $sa->id,
                "EEC IT: Ticket #{$ticket->id} - {$ticket->title} has been reopened.",
            );
        });
    }
}
