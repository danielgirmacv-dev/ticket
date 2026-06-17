<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Profile extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'name',
        'email',
        'avatar_url',
        'department',
        'telegram_username',
        'telegram_chat_id',
    ];

    protected $casts = [
        'telegram_chat_id' => 'integer',
    ];

    /**
     * Get the user that owns the profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the assets assigned to this profile.
     */
    public function assignedAssets(): HasMany
    {
        return $this->hasMany(Asset::class, 'assigned_to');
    }

    /**
     * Get the maintenance tickets requested by this profile.
     */
    public function requestedTickets(): HasMany
    {
        return $this->hasMany(MaintenanceTicket::class, 'requester_id');
    }

    /**
     * Get the maintenance tickets assigned to this profile.
     */
    public function assignedTickets(): HasMany
    {
        return $this->hasMany(MaintenanceTicket::class, 'assigned_technician_id');
    }
}
