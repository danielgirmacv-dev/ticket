<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\MaintenanceTicketController;
use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\User;
use App\Services\UserApprovalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user.
     */
    public function register(Request $request)
    {
        if ($request->has('email')) {
            $request->merge(['email' => strtolower(trim($request->email))]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email:rfc,filter|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:30',
            'telegram_username' => 'nullable|string|max:255',
            'location_id' => 'nullable|exists:locations,id',
        ]);

        $user = DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'status' => 'pending',
            ]);

            // Create profile for the user
            Profile::create([
                'user_id' => $user->id,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'telegram_username' => $validated['telegram_username'] ?? null,
                'location_id' => $validated['location_id'] ?? null,
            ]);

            // Assign default role
            $user->assignRole('requester');

            return $user;
        });

        // Notify Admins (managers) and Super Admins
        try {
            $managers = User::role('admin')->get()->merge(User::role('super_admin')->get());
            foreach ($managers as $manager) {
                \App\Models\Notification::create([
                    'user_id' => $manager->id,
                    'title' => 'New User Registration (Pending Approval)',
                    'message' => "A new user {$user->name} ({$user->email}) has registered and is awaiting approval.",
                    'type' => 'info',
                    'link' => '/users',
                    'is_read' => false,
                ]);
            }
        } catch (\Throwable $e) {
            // Log error but don't fail registration
            Log::error('Failed to notify admins of new user: '.$e->getMessage());
        }

        // Don't auto-login pending users
        $autoApproveMinutes = (int) config('registration.auto_approve_after_minutes');

        $pendingMessage = 'Registration successful! Your account is pending admin approval. You will receive a notification once approved.';
        try {
            $pendingMessage = UserApprovalService::registrationPendingMessage();
        } catch (\Throwable $e) {
            Log::warning('UserApprovalService message error: '.$e->getMessage());
        }

        return response()->json([
            'message' => $pendingMessage,
            'status' => 'pending',
            'auto_approve_after_minutes' => $autoApproveMinutes > 0 ? $autoApproveMinutes : null,
            'support_email' => config('registration.support_email'),
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
        ], 201);
    }

    /**
     * Login user and create token.
     */
    public function login(Request $request)
    {
        if ($request->has('email')) {
            $request->merge(['email' => strtolower(trim($request->email))]);
        }

        $request->validate([
            'email' => 'required|string|email:rfc,filter',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Check user status
        if ($user->status === 'pending') {
            throw ValidationException::withMessages([
                'email' => ['Your account is awaiting admin approval. Please try again later.'],
            ]);
        }

        if ($user->status === 'rejected') {
            throw ValidationException::withMessages([
                'email' => ['Your account registration was not approved. Please contact your administrator.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user->load('profile.location', 'roles'),
            'token' => $token,
        ]);
    }

    /**
     * Logout user (revoke token).
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get the authenticated user.
     */
    public function user(Request $request)
    {
        return response()->json([
            'user' => $request->user()->load('profile.location', 'roles'),
        ]);
    }

    /**
     * Update user password.
     */
    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        // Verify current password
        if (! Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        // Update password - Laravel auto-hashes due to the 'hashed' cast.
        $user->password = $validated['new_password'];
        $user->save();

        return response()->json([
            'message' => 'Password updated successfully',
        ]);
    }

    /**
     * Create a new user (Admin only).
     */
    public function storeUser(Request $request)
    {
        $admin = $request->user();

        if (! $admin->hasAnyRole(['admin', 'super_admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($request->has('email')) {
            $request->merge(['email' => strtolower(trim($request->email))]);
        }

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'email'       => 'required|string|email:rfc,filter|max:255|unique:users',
            'password'    => 'required|string|min:8',
            'role'        => 'required|in:super_admin,admin,technician,requester',
            'department'  => 'nullable|string|max:255',
            'phone'       => 'nullable|string|max:30',
            'location_id' => 'nullable|exists:locations,id',
        ]);

        // Managers cannot create other managers or super admins
        if (! $admin->hasRole('super_admin') && in_array($validated['role'], ['admin', 'super_admin'], true)) {
            return response()->json([
                'message' => 'Only super admins can create manager or super admin accounts.',
            ], 403);
        }

        // Managers only create technicians for their own department team
        if ($admin->hasRole('admin') && ! $admin->hasRole('super_admin')) {
            $adminDept = $admin->profile?->department;
            $adminName = strtolower($admin->name ?? '');
            $adminEmail = strtolower($admin->email ?? '');
            $isSapManager = str_contains(strtolower($adminDept ?? ''), 'sap')
                || str_contains(strtolower($adminDept ?? ''), 'erp')
                || str_contains($adminName, 'sap')
                || str_contains($adminEmail, 'sap')
                || str_contains($adminName, 'deployment');

            if ($validated['role'] === 'technician') {
                if (empty($validated['department'])) {
                    $validated['department'] = $adminDept ?: ($isSapManager ? 'SAP Deployment' : 'IT Support');
                } else {
                    $selectedDept = strtolower($validated['department']);
                    $isSapDept = str_contains($selectedDept, 'sap') || str_contains($selectedDept, 'erp');
                    if ($isSapManager && ! $isSapDept) {
                        return response()->json(['message' => 'SAP managers can only create technicians for the SAP team.'], 422);
                    }
                    if (! $isSapManager && $isSapDept) {
                        return response()->json(['message' => 'IT Support managers cannot create technicians for the SAP team.'], 422);
                    }
                }
            }
        }

        $user = DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'status' => 'active',
            ]);

            Profile::create([
                'user_id'     => $user->id,
                'name'        => $validated['name'],
                'email'       => $validated['email'],
                'phone'       => $validated['phone'] ?? null,
                'department'  => $validated['department'] ?? null,
                'location_id' => $validated['location_id'] ?? null,
            ]);

            $user->assignRole($validated['role']);

            return $user;
        });

        // Refresh cached manager-routing so new managers are picked up immediately
        MaintenanceTicketController::forgetRoutingCache();

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user->load('profile', 'roles'),
        ], 201);
    }

    /**
     * Approve a pending user (Admin only).
     */
    public function approveUser(Request $request, $id)
    {
        $admin = $request->user();

        if (! $admin->hasAnyRole(['admin', 'super_admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);

        if ($user->status !== 'pending') {
            return response()->json(['message' => 'User is not pending approval'], 400);
        }

        app(UserApprovalService::class)->approveIfPending($user->fresh(['profile']));

        return response()->json([
            'message' => 'User approved successfully',
            'user' => $user->fresh(['profile', 'roles']),
        ]);
    }

    /**
     * Reject a pending user (Admin only).
     */
    public function rejectUser(Request $request, $id)
    {
        $admin = $request->user();

        if (! $admin->hasAnyRole(['admin', 'super_admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);

        if ($user->status !== 'pending') {
            return response()->json(['message' => 'User is not pending approval'], 400);
        }

        $user->update(['status' => 'rejected']);

        // Notify the user
        try {
            \App\Models\Notification::create([
                'user_id' => $user->id,
                'title' => 'Account Not Approved',
                'message' => 'Your registration was not approved. Please contact your administrator for more information.',
                'type' => 'error',
                'is_read' => false,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to notify user of rejection: '.$e->getMessage());
        }

        return response()->json([
            'message' => 'User rejected successfully',
            'user' => $user,
        ]);
    }
}
