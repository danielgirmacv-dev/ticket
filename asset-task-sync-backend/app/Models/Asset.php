<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Asset extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'type',
        'serial_number',
        'purchase_date',
        'warranty_expiry',
        'location',
        'status',
        'assigned_to',
        'notes',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'warranty_expiry' => 'date',
    ];

    /**
     * Get the profile assigned to this asset.
     */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'assigned_to');
    }

    /**
     * Get the maintenance tickets for this asset.
     */
    public function maintenanceTickets(): HasMany
    {
        return $this->hasMany(MaintenanceTicket::class);
    }
}
