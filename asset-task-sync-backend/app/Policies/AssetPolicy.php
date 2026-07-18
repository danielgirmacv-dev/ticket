<?php

namespace App\Policies;

use App\Models\Asset;
use App\Models\User;

class AssetPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view assets');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Asset $asset): bool
    {
        return $user->hasPermissionTo('view assets');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('manage assets');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Asset $asset): bool
    {
        return $user->hasPermissionTo('manage assets');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Asset $asset): bool
    {
        return $user->hasAnyRole(['admin', 'super_admin']);
    }
}
