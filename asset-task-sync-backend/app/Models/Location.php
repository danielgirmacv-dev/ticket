<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Location extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'address',
        'description',
    ];

    /**
     * Profiles assigned to this location.
     */
    public function profiles(): HasMany
    {
        return $this->hasMany(Profile::class, 'location_id');
    }
}
