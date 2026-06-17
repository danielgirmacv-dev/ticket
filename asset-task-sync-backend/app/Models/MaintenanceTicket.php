<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceTicket extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'title',
        'description',
        'type',
        'status',
        'priority',
        'asset_id',
        'requester_id',
        'assigned_technician_id',
        'scheduled_date',
        'completed_date',
        'estimated_duration',
        'actual_duration',
        'is_recurring',
        'recurring_interval',
        'notes',
        'rejection_reason',
        'diagnosis',
        'actions_taken',
        'spare_parts',
        'images',
        'feedback_rating',
        'feedback_comment',
        'approved_by',
        'reviewed_by',
        'approved_at',
        'started_at',
        'reviewed_at',
    ];

    protected $casts = [
        'scheduled_date' => 'datetime',
        'completed_date' => 'datetime',
        'is_recurring' => 'boolean',
        'spare_parts' => 'array',
        'images' => 'array',
        'approved_at' => 'datetime',
        'started_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    /**
     * Get the asset that this ticket belongs to.
     */
    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    /**
     * Get the profile that requested this ticket.
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'requester_id');
    }

    /**
     * Get the technician assigned to this ticket.
     */
    public function assignedTechnician(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'assigned_technician_id');
    }

    /**
     * Scope a query to only include pending tickets.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope a query to only include in-progress tickets.
     */
    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    /**
     * Scope a query to only include completed tickets.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Get the profile that approved this ticket.
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'approved_by');
    }

    /**
     * Get the profile that reviewed this ticket completion.
     */
    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'reviewed_by');
    }

    /**
     * Scope a query to filter by priority.
     */
    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }
}
