<?php

namespace App\Policies;

use App\Models\MaintenanceTicket;
use App\Models\User;

class MaintenanceTicketPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view tickets');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, MaintenanceTicket $maintenanceTicket): bool
    {
        return $user->hasPermissionTo('view tickets');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // All authenticated users can create tickets (requesters, technicians, admins)
        // Assuming 'view tickets' implies basic access, or we can check for a specific permission if needed.
        // For now, let's assume anyone logged in can create a request.
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, MaintenanceTicket $maintenanceTicket): bool
    {
        if ($user->hasPermissionTo('manage tickets')) {
            return true;
        }

        // Requesters can cancel their own submitted tickets
        if ($maintenanceTicket->requester_id === $user->profile?->id) {
            return in_array($maintenanceTicket->status, ['submitted', 'reopened']);
        }

        return false;
    }

    /**
     * Determine whether the user can manage tickets (approve, reject, assign, review).
     */
    public function manage(User $user): bool
    {
        return $user->hasPermissionTo('manage tickets');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, MaintenanceTicket $maintenanceTicket): bool
    {
        return $user->hasAnyRole(['admin', 'super_admin']);
    }
}
