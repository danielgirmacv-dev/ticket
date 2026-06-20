<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user.
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'telegram_username' => 'nullable|string|max:255',
            'location_id' => 'nullable|exists:locations,id',
        ]);

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
            'telegram_username' => $validated['telegram_username'] ?? null,
            'location_id' => $validated['location_id'] ?? null,
        ]);

        // Assign default role
        $user->assignRole('requester');

        // Notify Admins
        try {
            $admins = User::role('admin')->get();
            foreach ($admins as $admin) {
                \App\Models\Notification::create([
                    'user_id' => $admin->id,
                    'title' => 'New User Registration (Pending Approval)',
                    'message' => "A new user {$user->name} ({$user->email}) has registered and is awaiting approval.",
                    'type' => 'info',
                    'link' => '/users',
                    'is_read' => false,
                ]);
            }
        } catch (\Exception $e) {
            // Log error but don't fail registration
            \Illuminate\Support\Facades\Log::error('Failed to notify admins of new user: ' . $e->getMessage());
        }

        // Don't auto-login pending users
        return response()->json([
            'message' => 'Registration successful! Your account is pending admin approval. You will receive a notification once approved.',
            'status' => 'pending',
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ]
        ], 201);
    }

    /**
     * Login user and create token.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
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
            'user' => $user->load('profile', 'roles'),
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
            'user' => $request->user()->load('profile', 'roles'),
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
        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        // Update password - Laravel 11 will auto-hash due to 'hashed' cast
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

        if (!$admin->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,technician,requester',
            'department' => 'nullable|string|max:255',
            'location_id' => 'nullable|exists:locations,id',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'status' => 'active',
        ]);

        Profile::create([
            'user_id' => $user->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'department' => $validated['department'] ?? null,
            'location_id' => $validated['location_id'] ?? null,
        ]);

        $user->assignRole($validated['role']);

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

        if (!$admin->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);

        if ($user->status !== 'pending') {
            return response()->json(['message' => 'User is not pending approval'], 400);
        }

        $user->update(['status' => 'active']);

        // Notify the user
        try {
            \App\Models\Notification::create([
                'user_id' => $user->id,
                'title' => 'Account Approved',
                'message' => 'Your account has been approved! You can now log in and access the system.',
                'type' => 'success',
                'link' => '/auth',
                'is_read' => false,
            ]);

            // Send Telegram notification
            if ($user->profile->telegram_username) {
                $telegram = new \App\Services\TelegramService();
                $telegram->sendApprovalNotification($user);
            }

            // Send email notification (queued)
            \Illuminate\Support\Facades\Mail::to($user->email)->queue(new \App\Mail\AccountApproved($user));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to notify user of approval: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'User approved successfully',
            'user' => $user
        ]);
    }

    /**
     * Reject a pending user (Admin only).
     */
    public function rejectUser(Request $request, $id)
    {
        $admin = $request->user();

        if (!$admin->hasRole('admin')) {
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
            \Illuminate\Support\Facades\Log::error('Failed to notify user of rejection: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'User rejected successfully',
            'user' => $user
        ]);
    }
}
