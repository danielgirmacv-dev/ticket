<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

class ActivityLogger
{
    /**
     * Log a user activity.
     *
     * @param string $action The action performed (e.g., 'created', 'updated', 'deleted')
     * @param string $entityType The type of entity (e.g., 'Ticket', 'Asset', 'User')
     * @param string $entityId The ID of the entity
     * @param string|null $details Additional details about the action
     * @return void
     */
    public static function log($action, $entityType, $entityId, $details = null)
    {
        if (Auth::check()) {
            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'details' => $details,
            ]);
        }
    }
}
