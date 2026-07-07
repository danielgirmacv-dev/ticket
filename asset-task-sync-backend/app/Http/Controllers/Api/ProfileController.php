<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    /**
     * Display a listing of profiles.
     */
    /**
     * Display a listing of profiles.
     */
    public function index()
    {
        $profiles = Profile::with([
            'user' => function ($query) {
                $query->select('id', 'name', 'email', 'status', 'created_at', 'updated_at');
            },
            'user.roles',
            'location',
        ])->get();

        return response()->json($profiles);
    }

    /**
     * Display the specified profile.
     */
    public function show(Profile $profile)
    {
        return response()->json($profile->load('user.roles', 'assignedAssets', 'requestedTickets', 'assignedTickets', 'location'));
    }

    /**
     * Update the specified profile.
     */
    public function update(Request $request, Profile $profile)
    {
        // Admins can update any profile, regular users can only update their own
        if (! auth()->user()->hasRole('admin') && $profile->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $rules = [
            'name' => 'sometimes|string|max:255',
            'avatar_url' => 'nullable|string',
            'department' => 'nullable|string',
            'location_id' => 'nullable|exists:locations,id',
        ];

        if (auth()->user()->hasRole('admin')) {
            $rules['email'] = 'sometimes|string|email|max:255|unique:users,email,'.$profile->user_id;
        }

        $validated = $request->validate($rules);

        $profile->update($validated);

        $userUpdates = [];
        if (isset($validated['name'])) {
            $userUpdates['name'] = $validated['name'];
        }
        if (isset($validated['email'])) {
            $userUpdates['email'] = $validated['email'];
        }
        if (! empty($userUpdates)) {
            $profile->user->update($userUpdates);
        }

        ActivityLogger::log('updated', 'Profile', $profile->id, "Updated profile for user: {$profile->name}");

        return response()->json($profile);
    }

    /**
     * Update the user's role.
     */
    public function updateRole(Request $request, Profile $profile)
    {
        // Only admin can update roles
        if (! auth()->user()->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'role' => 'required|in:admin,technician,requester',
        ]);

        $profile->user->syncRoles([$validated['role']]);

        ActivityLogger::log('updated', 'User', $profile->user_id, "Updated role to {$validated['role']} for user: {$profile->name}");

        return response()->json(['message' => 'Role updated successfully']);
    }

    /**
     * Delete a user profile (Admin only).
     */
    public function destroy(Profile $profile)
    {
        // Only admin can delete users
        if (! auth()->user()->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Prevent deleting the last admin
        if ($profile->user->hasRole('admin')) {
            $adminCount = \App\Models\User::role('admin')->count();
            if ($adminCount <= 1) {
                return response()->json(['message' => 'Cannot delete the last admin user'], 400);
            }
        }

        $userName = $profile->name;
        $userId = $profile->user_id;

        // Delete the associated user (this will cascade delete the profile)
        $profile->user()->delete();

        ActivityLogger::log('deleted', 'User', $userId, "Deleted user: {$userName}");

        return response()->json(['message' => 'User deleted successfully']);
    }
}
