<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceSchedule extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'title',
        'description',
        'asset_id',
        'type',
        'frequency',
        'next_run_date',
        'last_run_date',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'next_run_date' => 'date',
        'last_run_date' => 'date',
        'is_active' => 'boolean',
    ];

    /**
     * Get the asset that this schedule belongs to.
     */
    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    /**
     * Get the profile that created this schedule.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'created_by');
    }

    /**
     * Scope a query to only include active schedules.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include due schedules.
     */
    public function scopeDue($query)
    {
        return $query->where('next_run_date', '<=', now());
    }
}
