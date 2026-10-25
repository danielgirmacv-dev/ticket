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
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Profile::with([
            'user' => function ($query) {
                $query->select('id', 'name', 'email', 'status', 'created_at', 'updated_at');
            },
            'user.roles',
            'location',
        ])
        ->orderByRaw("
            CASE WHEN EXISTS (
                SELECT 1 FROM users
                WHERE users.id = profiles.user_id
                AND users.status = 'pending'
            ) THEN 0 ELSE 1 END
        ")
        ->latest();

        // If the authenticated user is a manager (admin) but not super_admin,
        // isolate technicians so each manager only sees their own team.
        // Primary key: support_category column (it_support | sap | general).
        // Fallback: department/name/email keyword matching for legacy profiles.
        if ($user && $user->hasRole('admin') && ! $user->hasRole('super_admin')) {
            $managerCategory = $user->profile?->support_category; // 'it_support' | 'sap' | 'general' | null

            // If no explicit support_category, derive from department/name heuristics
            if (! $managerCategory) {
                $dept  = strtolower($user->profile?->department ?? '');
                $uname = strtolower($user->name ?? '');
                $email = strtolower($user->email ?? '');

                if (str_contains($dept, 'sap') || str_contains($dept, 'erp') || str_contains($dept, 'system')
                    || str_contains($uname, 'sap') || str_contains($uname, 'erp') || str_contains($uname, 'system')
                    || str_contains($email, 'sap') || str_contains($email, 'erp') || str_contains($email, 'system')
                    || str_contains($uname, 'deployment')) {
                    $managerCategory = 'sap';
                } elseif (str_contains($dept, 'facility') || str_contains($dept, 'facilities')
                    || str_contains($dept, 'maintenance') || str_contains($dept, 'workplace')
                    || str_contains($uname, 'facility') || str_contains($email, 'facility')) {
                    $managerCategory = 'general';
                } else {
                    $managerCategory = 'it_support';
                }
            }

            $mc = $managerCategory; // capture for closure
            $currentUserId = $user->id;

            $query->where(function ($q) use ($mc, $currentUserId) {
                // 1. The manager themselves (always see own profile)
                $q->where('user_id', $currentUserId)
                // 2. Super Admins (visible for escalation/contact)
                ->orWhereHas('user.roles', function ($rq) {
                    $rq->where('name', 'super_admin');
                })
                // 3. Requesters (visible but locked from edits)
                ->orWhereHas('user.roles', function ($rq) {
                    $rq->where('name', 'requester');
                })
                // 4. Technicians belonging to this manager's category
                ->orWhere(function ($tq) use ($mc) {
                    $tq->whereHas('user.roles', function ($rq) {
                        $rq->where('name', 'technician');
                    })->where(function ($cat) use ($mc) {
                        // Exact category match (clean data)
                        $cat->where('support_category', $mc);

                        // Keyword fallback for technicians lacking support_category
                        if ($mc === 'sap') {
                            $cat->orWhere(function ($kw) {
                                $kw->whereNull('support_category')
                                    ->where(function ($sub) {
                                        $sub->where('department', 'like', '%sap%')
                                            ->orWhere('department', 'like', '%erp%')
                                            ->orWhere('department', 'like', '%system%')
                                            ->orWhere('name', 'like', '%sap%')
                                            ->orWhere('name', 'like', '%erp%')
                                            ->orWhere('name', 'like', '%system%')
                                            ->orWhere('email', 'like', '%sap%')
                                            ->orWhere('email', 'like', '%erp%')
                                            ->orWhere('email', 'like', '%system%');
                                    });
                            });
                        } elseif ($mc === 'general') {
                            $cat->orWhere(function ($kw) {
                                $kw->whereNull('support_category')
                                    ->where(function ($sub) {
                                        $sub->where('department', 'like', '%facility%')
                                            ->orWhere('department', 'like', '%facilities%')
                                            ->orWhere('department', 'like', '%maintenance%')
                                            ->orWhere('department', 'like', '%general%')
                                            ->orWhere('department', 'like', '%workplace%')
                                            ->orWhere('name', 'like', '%facility%')
                                            ->orWhere('email', 'like', '%facility%');
                                    });
                            });
                        } else {
                            // it_support — everything that isn't sap or general
                            $cat->orWhere(function ($kw) {
                                $kw->whereNull('support_category')
                                    ->where(function ($sub) {
                                        $sub->whereNull('department')
                                            ->orWhere(function ($inner) {
                                                $inner->where('department', 'not like', '%sap%')
                                                      ->where('department', 'not like', '%erp%')
                                                      ->where('department', 'not like', '%facility%')
                                                      ->where('department', 'not like', '%facilities%')
                                                      ->where('department', 'not like', '%maintenance%')
                                                      ->where('department', 'not like', '%workplace%');
                                            });
                                    })
                                    ->where('name', 'not like', '%sap%')
                                    ->where('email', 'not like', '%sap%')
                                    ->where('name', 'not like', '%facility%')
                                    ->where('email', 'not like', '%facility%');
                            });
                        }
                    });
                });
            });
        }

        $profiles = $query->get();

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
        // Admins/super_admins can update any profile, regular users can only update their own
        if (! auth()->user()->hasAnyRole(['admin', 'super_admin']) && $profile->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Managers cannot edit requesters (requesters are locked) or other managers/admins
        if (auth()->user()->hasRole('admin') && ! auth()->user()->hasRole('super_admin')) {
            if ($profile->user_id !== auth()->id()) {
                if ($profile->user->hasRole('requester')) {
                    return response()->json([
                        'message' => 'Requester accounts are locked. Managers cannot edit requesters.',
                    ], 403);
                }
                if ($profile->user->hasAnyRole(['admin', 'super_admin'])) {
                    return response()->json([
                        'message' => 'Managers cannot edit other manager or super admin accounts.',
                    ], 403);
                }
            }
        }

        $rules = [
            'name'             => 'sometimes|string|max:255',
            'phone'            => 'nullable|string|max:30',
            'avatar_url'       => 'nullable|string',
            'department'       => 'nullable|string',
            'location_id'      => 'nullable|exists:locations,id',
        ];

        // Only admins/super_admins can set the support_category routing tag
        if (auth()->user()->hasAnyRole(['admin', 'super_admin'])) {
            $rules['support_category'] = 'nullable|in:it_support,sap,general';
        }

        if ($request->has('email')) {
            $request->merge(['email' => strtolower(trim($request->email))]);
        }

        if (auth()->user()->hasAnyRole(['admin', 'super_admin'])) {
            $rules['email'] = 'sometimes|string|email:rfc,filter|max:255|unique:users,email,'.$profile->user_id;
        }

        $validated = $request->validate($rules);

        $profile->update($validated);

        // Changing a manager's department/support category affects ticket routing
        if (isset($validated['department']) || isset($validated['support_category'])) {
            MaintenanceTicketController::forgetRoutingCache();
        }

        // Sync name/email changes to the users table
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
        // Only admin/super_admin can update roles
        if (! auth()->user()->hasAnyRole(['admin', 'super_admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Only super admins can assign manager/super_admin or modify those accounts
        if (! auth()->user()->hasRole('super_admin')) {
            $requestedRole = $request->input('role');
            if (in_array($requestedRole, ['super_admin', 'admin', 'requester'], true)) {
                return response()->json(['message' => 'Managers cannot assign manager, super admin, or requester roles'], 403);
            }
            if ($profile->user->hasRole('requester')) {
                return response()->json(['message' => 'Requester accounts are locked. Managers cannot modify requester roles.'], 403);
            }
            if ($profile->user->hasAnyRole(['admin', 'super_admin'])) {
                return response()->json(['message' => 'Cannot modify a manager or super admin account'], 403);
            }
        }

        $validated = $request->validate([
            'role' => 'required|in:super_admin,admin,technician,requester',
        ]);

        $profile->user->syncRoles([$validated['role']]);

        // Role change may add/remove a manager — refresh cached ticket routing
        MaintenanceTicketController::forgetRoutingCache();

        ActivityLogger::log('updated', 'User', $profile->user_id, "Updated role to {$validated['role']} for user: {$profile->name}");

        return response()->json(['message' => 'Role updated successfully']);
    }

    /**
     * Delete a user profile (Admin only).
     */
    public function destroy(Profile $profile)
    {
        // Only admin/super_admin can delete users
        if (! auth()->user()->hasAnyRole(['admin', 'super_admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Managers cannot delete requesters (locked) or other manager / super admin accounts
        if (! auth()->user()->hasRole('super_admin')) {
            if ($profile->user->hasRole('requester')) {
                return response()->json(['message' => 'Requester accounts are locked. Managers cannot delete requesters.'], 403);
            }
            if ($profile->user->hasAnyRole(['admin', 'super_admin'])) {
                return response()->json(['message' => 'Only super admins can delete manager or super admin accounts'], 403);
            }
        }

        // Prevent deleting the last super admin
        if ($profile->user->hasRole('super_admin')) {
            $superAdminCount = \App\Models\User::role('super_admin')->count();
            if ($superAdminCount <= 1) {
                return response()->json(['message' => 'Cannot delete the last super admin user'], 400);
            }
        }

        // Prevent deleting the last manager
        if ($profile->user->hasRole('admin')) {
            $adminCount = \App\Models\User::role('admin')->count();
            if ($adminCount <= 1) {
                return response()->json(['message' => 'Cannot delete the last admin user'], 400);
            }
        }

        $userName = $profile->name;
        $userId = $profile->user_id;

        // Deleting a manager would leave a stale routing entry — refresh the cache
        MaintenanceTicketController::forgetRoutingCache();

        // Delete the associated user (this will cascade delete the profile)
        $profile->user()->delete();

        ActivityLogger::log('deleted', 'User', $userId, "Deleted user: {$userName}");

        return response()->json(['message' => 'User deleted successfully']);
    }
}
