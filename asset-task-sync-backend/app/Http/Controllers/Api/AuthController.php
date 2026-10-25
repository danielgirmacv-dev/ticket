<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\MaintenanceTicketController;
use App\Http\Controllers\Controller;
use App\Mail\NewUserRegistrationMail;
use App\Models\Notification;
use App\Models\Profile;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\TelegramService;
use App\Services\UserApprovalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
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

        // Notify Admins (managers) and Super Admins (in-app)
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

        // Send email to Super Admins awaiting approval
        try {
            $user->loadMissing('profile');
            $superAdmins = User::role('super_admin')->get();
            foreach ($superAdmins as $superAdmin) {
                if ($superAdmin->email) {
                    Mail::to($superAdmin->email)->send(new NewUserRegistrationMail($user, $superAdmin->name));
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Failed sending new user registration email to super admins: '.$e->getMessage());
        }

        // Welcome notification to the new user
        try {
            NotificationService::create(
                $user->id,
                'Account Created',
                "Welcome {$validated['name']}! Your account has been created and is pending approval.",
                'info',
                '/auth'
            );
        } catch (\Throwable $e) {
            Log::warning('Welcome notification failed: '.$e->getMessage());
        }

        // Don't auto-login pending users
        $autoApproveMinutes = (int) config('registration.auto_approve_after_minutes');

        $pendingMessage = 'Registration successful! Your account is pending admin approval. You will receive a notification once approved.';
        try {
            $pendingMessage = UserApprovalService::registrationPendingMessage();
        } catch (\Throwable $e) {
            Log::warning('UserApprovalService message error: '.$e->getMessage());
        }

        $botUsername = env('TELEGRAM_BOT_USERNAME', 'eec_it_bot');

        return response()->json([
            'message' => $pendingMessage,
            'status' => 'pending',
            'auto_approve_after_minutes' => $autoApproveMinutes > 0 ? $autoApproveMinutes : null,
            'support_email' => config('registration.support_email'),
            'telegram_bot_username' => $botUsername,
            'telegram_bot_link' => $botUsername ? "https://t.me/{$botUsername}?start" : null,
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
            'name'             => 'required|string|max:255',
            'email'            => 'required|string|email:rfc,filter|max:255|unique:users',
            'password'         => 'required|string|min:8',
            'role'             => 'required|in:super_admin,admin,technician,requester',
            'department'       => 'nullable|string|max:255',
            'support_category' => 'nullable|in:it_support,sap,general',
            'phone'            => 'nullable|string|max:30',
            'location_id'      => 'nullable|exists:locations,id',
        ]);

        // Managers cannot create other managers, super admins, or requester accounts
        if (! $admin->hasRole('super_admin')) {
            if (in_array($validated['role'], ['admin', 'super_admin'], true)) {
                return response()->json([
                    'message' => 'Only super admins can create manager or super admin accounts.',
                ], 403);
            }
            if ($validated['role'] === 'requester') {
                return response()->json([
                    'message' => 'Requester accounts are locked. Managers can only create and manage technicians in their department.',
                ], 403);
            }
        }

        // Managers only create technicians for their own department team
        if ($admin->hasRole('admin') && ! $admin->hasRole('super_admin')) {
            // Determine the manager's category — explicit support_category takes priority.
            $adminCategory = $admin->profile?->support_category;

            if (! $adminCategory) {
                $adminDept = strtolower($admin->profile?->department ?? '');
                $adminName = strtolower($admin->name ?? '');
                $adminEmail = strtolower($admin->email ?? '');

                if (str_contains($adminDept, 'sap') || str_contains($adminDept, 'erp')
                    || str_contains($adminName, 'sap') || str_contains($adminEmail, 'sap')
                    || str_contains($adminName, 'deployment')) {
                    $adminCategory = 'sap';
                } elseif (str_contains($adminDept, 'facility') || str_contains($adminDept, 'facilities')
                    || str_contains($adminDept, 'maintenance') || str_contains($adminDept, 'workplace')
                    || str_contains($adminName, 'facility') || str_contains($adminEmail, 'facility')) {
                    $adminCategory = 'general';
                } else {
                    $adminCategory = 'it_support';
                }
            }

            if ($validated['role'] === 'technician') {
                // If the caller provided an explicit support_category, verify it matches the manager's
                if (! empty($validated['support_category']) && $validated['support_category'] !== $adminCategory) {
                    return response()->json([
                        'message' => 'You can only create technicians in your own support category ('.$adminCategory.').',
                    ], 422);
                }

                // Auto-assign the technician to the manager's category & department
                if (empty($validated['support_category'])) {
                    $validated['support_category'] = $adminCategory;
                }

                if (empty($validated['department'])) {
                    $validated['department'] = $admin->profile?->department
                        ?: match ($adminCategory) {
                            'sap'      => 'System & ERP Support',
                            'general'  => 'Facility Management',
                            default    => 'IT Support',
                        };
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
                'user_id'          => $user->id,
                'name'             => $validated['name'],
                'email'            => $validated['email'],
                'phone'            => $validated['phone'] ?? null,
                'department'       => $validated['department'] ?? null,
                'support_category' => $validated['support_category'] ?? null,
                'location_id'      => $validated['location_id'] ?? null,
            ]);

            $user->assignRole($validated['role']);

            return $user;
        });

        // Refresh cached manager-routing so new managers are picked up immediately
        MaintenanceTicketController::forgetRoutingCache();

        // Welcome notification to the new user
        try {
            NotificationService::create(
                $user->id,
                'Account Created',
                "Welcome {$validated['name']}! Your account ({$validated['role']}) has been created.",
                'info',
                '/auth'
            );
        } catch (\Throwable $e) {
            Log::warning('Welcome notification failed: '.$e->getMessage());
        }

        // Notify managers/super admins of the new signup
        try {
            foreach (User::whereHas('roles', fn($q) => $q->whereIn('name', ['admin', 'super_admin']))->get() as $admin) {
                if ($admin->id === $user->id) {
                    continue;
                }
                NotificationService::create(
                    $admin->id,
                    'New User Signed Up',
                    "A new user {$validated['name']} ({$validated['email']}) has been created as {$validated['role']}.",
                    'info',
                    '/users'
                );
            }
        } catch (\Throwable $e) {
            Log::warning('New-user signup notification failed: '.$e->getMessage());
        }

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

        // Managers cannot approve requester accounts (Super Admin only)
        if ($admin->hasRole('admin') && ! $admin->hasRole('super_admin')) {
            if ($user->hasRole('requester')) {
                return response()->json([
                    'message' => 'Requester accounts can only be approved by Super Administrators. Managers cannot approve requesters.',
                ], 403);
            }
        }

        app(UserApprovalService::class)->approveIfPending($user->fresh(['profile']));

        // Notify the user via Telegram that their account is now approved
        try {
            app(TelegramService::class)->sendApprovalNotification($user->fresh(['profile']));
        } catch (\Throwable $e) {
            Log::warning('Approval Telegram notification failed: '.$e->getMessage());
        }

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

        // Managers cannot reject requester accounts (Super Admin only)
        if ($admin->hasRole('admin') && ! $admin->hasRole('super_admin')) {
            if ($user->hasRole('requester')) {
                return response()->json([
                    'message' => 'Requester accounts can only be rejected by Super Administrators. Managers cannot reject requesters.',
                ], 403);
            }
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
