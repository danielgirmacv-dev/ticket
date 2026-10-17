<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SendTicketApprovalNotification;
use App\Jobs\SendTicketApprovedNotification;
use App\Jobs\SendTicketAssignedNotification;
use App\Jobs\SendTicketRejectedNotification;
use App\Jobs\SendTicketSubmittedNotification;
use App\Models\MaintenanceTicket;
use App\Models\Profile;
use App\Services\ActivityLogger;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class MaintenanceTicketController extends Controller
{
    /**
     * Display a listing of maintenance tickets.
     */
    public function index(Request $request)
    {
        $query = MaintenanceTicket::with('asset', 'requester', 'assignedTechnician', 'assignedManager');

        $user = $request->user();

        if ($user->hasRole('super_admin')) {
            // Super Admins see ALL tickets — no filtering
        } elseif ($user->hasRole('admin')) {
            // Managers see only tickets routed to them via assigned_manager_id
            $managerProfileId = $user->profile?->id;
            $query->where('assigned_manager_id', $managerProfileId);
        } elseif ($user->hasRole('technician')) {
            // Technicians see tickets assigned to them
            $query->where('assigned_technician_id', $user->profile->id);
        } else {
            // Requesters only see tickets they created
            $query->where('requester_id', $user->profile->id);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by priority
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        // Filter by support_category
        if ($request->has('support_category')) {
            $query->where('support_category', $request->support_category);
        }

        // Filter by assigned technician (only for admins/super_admins)
        if ($request->has('assigned_technician_id') && $user->hasAnyRole(['admin', 'super_admin'])) {
            $query->where('assigned_technician_id', $request->assigned_technician_id);
        }

        // Filter by requester (only for admins/super_admins)
        if ($request->has('requester_id') && $user->hasAnyRole(['admin', 'super_admin'])) {
            $query->where('requester_id', $request->requester_id);
        }

        // Filter by asset
        if ($request->has('asset_id')) {
            $query->where('asset_id', $request->asset_id);
        }

        $tickets = $query
            ->orderByRaw("CASE
                WHEN status = 'submitted' THEN 0
                WHEN status = 'completed_pending_review' THEN 1
                ELSE 2
            END")
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($tickets);
    }

    /**
     * Store a newly created maintenance ticket.
     */
    public function store(Request $request)
    {
        Gate::authorize('create', MaintenanceTicket::class);

        $validated = $request->validate([
            'title'                   => 'required|string|max:255',
            'description'             => 'nullable|string',
            'type'                    => 'required|in:maintenance,repair,installation,inspection,other',
            'support_category'        => 'sometimes|in:it_support,sap,general',
            'status'                  => 'sometimes|in:submitted,approved,rejected,assigned,in_progress,completed_pending_review,completed,reopened,cancelled',
            'priority'                => 'sometimes|in:low,medium,high,critical',
            'asset_id'                => 'nullable|uuid|exists:assets,id',
            'requester_id'            => 'nullable|uuid|exists:profiles,id',
            'assigned_technician_id'  => 'nullable|uuid|exists:profiles,id',
            'scheduled_date'          => 'required|date',
            'completed_date'          => 'nullable|date',
            'estimated_duration'      => 'nullable|integer',
            'actual_duration'         => 'nullable|integer',
            'is_recurring'            => 'sometimes|boolean',
            'recurring_interval'      => 'nullable|in:daily,weekly,monthly,quarterly,yearly',
            'recurring_ends_at'       => 'nullable|date|after_or_equal:today',
            'notes'                   => 'nullable|string',
            'attachments'             => 'nullable|array|max:5',
            'attachments.*'           => 'file|mimes:jpg,jpeg,png,gif,webp,pdf|max:5120',
        ]);

        // Default category to 'general' if not provided (matches DB column default)
        if (! isset($validated['support_category'])) {
            $validated['support_category'] = 'general';
        }

        // Auto-set requester_id to authenticated user's profile if not provided
        if (! isset($validated['requester_id'])) {
            $validated['requester_id'] = auth()->user()->profile->id;
        }

        // Restrict pending requests for requesters (allow up to 3 active requests)
        if (auth()->user()->hasRole('requester')) {
            $pendingCount = MaintenanceTicket::where('requester_id', $validated['requester_id'])
                ->whereIn('status', ['submitted', 'approved', 'assigned', 'in_progress', 'reopened'])
                ->count();

            if ($pendingCount >= 3) {
                return response()->json([
                    'message' => 'You already have 3 active requests in progress. Please wait for them to be completed before submitting a new one.',
                ], 400);
            }
        }

        $attachments = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('ticket-attachments', 'public');
                $attachments[] = [
                    'name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'url' => Storage::disk('public')->url($path),
                    'mime' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                ];
            }
        }

        unset($validated['attachments']);

        if (! empty($attachments)) {
            $validated['images'] = [
                'attachments' => $attachments,
            ];
        }

        if (empty($validated['asset_id'])) {
            $validated['asset_id'] = null;
        }

        if (empty($validated['is_recurring']) || ! filter_var($validated['is_recurring'], FILTER_VALIDATE_BOOLEAN)) {
            $validated['is_recurring'] = false;
            $validated['recurring_interval'] = null;
            $validated['recurring_ends_at'] = null;
        }

        $ticket = MaintenanceTicket::create($validated);
        $ticket->load('requester');

        ActivityLogger::log('created', 'Ticket', $ticket->id, "Created ticket: {$ticket->title}");

        // ---------------------------------------------------------------
        // Smart routing: route to the correct manager based on category
        // ---------------------------------------------------------------
        $assignedManager = null;
        try {
            $category = $ticket->support_category ?? 'it_support';
            $assignedManager = $this->assignManagerForCategory($ticket, $category);
        } catch (\Exception $e) {
            Log::error('Failed to route ticket: ' . $e->getMessage());
        }

        $categoryLabel = match ($ticket->support_category ?? 'general') {
            'it_support' => 'IT Support',
            'sap'        => 'SAP',
            default      => 'General',
        };

        // ✅ Save in-app notifications SYNCHRONOUSLY (no queue needed)
        NotificationService::ticketSubmitted(
            $ticket,
            $assignedManager?->id,
            $categoryLabel,
            auth()->id(),
        );

        // Queue only Telegram (network I/O) — safe to be async
        SendTicketSubmittedNotification::dispatch(
            $ticket,
            $assignedManager?->id,
            $categoryLabel,
            auth()->id()
        );

        return response()->json($ticket->load('asset', 'requester', 'assignedTechnician', 'assignedManager'), 201);
    }

    /**
     * Display the specified maintenance ticket.
     */
    public function show(MaintenanceTicket $maintenanceTicket)
    {
        Gate::authorize('view', $maintenanceTicket);

        return response()->json($maintenanceTicket->load('asset', 'requester', 'assignedTechnician'));
    }

    /**
     * Update the specified maintenance ticket.
     */
    public function update(Request $request, MaintenanceTicket $maintenanceTicket)
    {
        Gate::authorize('update', $maintenanceTicket);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'type' => 'sometimes|in:maintenance,repair,installation,inspection,other',
            'support_category' => 'sometimes|in:it_support,sap,general',
            'status' => 'sometimes|in:submitted,approved,rejected,assigned,in_progress,completed_pending_review,completed,reopened,cancelled',
            'priority' => 'sometimes|in:low,medium,high,critical',
            'asset_id' => 'nullable|uuid|exists:assets,id',
            'requester_id' => 'nullable|uuid|exists:profiles,id',
            'assigned_technician_id' => 'nullable|uuid|exists:profiles,id',
            'scheduled_date' => 'sometimes|date',
            'completed_date' => 'nullable|date',
            'estimated_duration' => 'nullable|integer',
            'actual_duration' => 'nullable|integer',
            'is_recurring' => 'sometimes|boolean',
            'recurring_interval' => 'nullable|in:daily,weekly,monthly,quarterly,yearly',
            'recurring_ends_at' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $maintenanceTicket->update($validated);

        return response()->json($maintenanceTicket->load('asset', 'requester', 'assignedTechnician'));
    }

    /**
     * Remove the specified maintenance ticket.
     */
    public function destroy(MaintenanceTicket $maintenanceTicket)
    {
        Gate::authorize('delete', $maintenanceTicket);

        $maintenanceTicket->delete();

        return response()->json(null, 204);
    }

    /**
     * Helper to create notifications
     */
    private function createNotification($userId, $title, $message, $type, $link = null)
    {
        try {
            \App\Models\Notification::create([
                'user_id' => $userId,
                'title' => $title,
                'message' => $message,
                'type' => $type,
                'link' => $link,
                'is_read' => false,
            ]);
        } catch (\Exception $e) {
            // Log error but don't fail the request
            Log::error('Failed to create notification: '.$e->getMessage());
        }
    }

    /**
     * Helper to send Telegram message to a user (gracefully skips if not linked)
     */
    private function sendTelegramToUser($user, string $message): void
    {
        try {
            if (! $user) {
                return;
            }
            $chatId = $user->profile?->telegram_chat_id ?? null;
            if (! $chatId) {
                return;
            }
            app(TelegramService::class)->sendMessage($chatId, $message);
        } catch (\Exception $e) {
            Log::warning('Telegram notification failed: ' . $e->getMessage());
        }
    }

    /**
     * Approve a maintenance ticket (Admin only).
     */
    public function approve(Request $request, $id)
    {
        Gate::authorize('manage', MaintenanceTicket::class);

        $ticket = MaintenanceTicket::findOrFail($id);

        if ($ticket->status !== 'submitted') {
            return response()->json(['message' => 'Ticket cannot be approved in current status'], 400);
        }

        $ticket->update([
            'status' => 'approved',
            'approved_by' => auth()->user()->profile->id,
            'approved_at' => now(),
        ]);

        ActivityLogger::log('approved', 'Ticket', $ticket->id, "Approved ticket: {$ticket->title}");

        // ✅ Save in-app notification synchronously
        NotificationService::ticketApproved($ticket);

        // Notify assigned manager and technician that the ticket was approved
        $ticket->loadMissing('assignedManager', 'assignedTechnician');
        $approverId = auth()->id();

        if ($ticket->assignedManager && $ticket->assignedManager->user_id && $ticket->assignedManager->user_id !== $approverId) {
            NotificationService::create(
                $ticket->assignedManager->user_id,
                'Ticket Approved',
                "Ticket '{$ticket->title}' has been approved.",
                'info',
                "/tickets/{$ticket->id}"
            );
        }

        if ($ticket->assignedTechnician && $ticket->assignedTechnician->user_id && $ticket->assignedTechnician->user_id !== $approverId) {
            NotificationService::create(
                $ticket->assignedTechnician->user_id,
                'Ticket Approved',
                "Ticket '{$ticket->title}' has been approved.",
                'info',
                "/tickets/{$ticket->id}"
            );
        }

        // Queue Telegram + email (network I/O)
        SendTicketApprovedNotification::dispatch($ticket, auth()->user()->name ?? 'Administrator');
        SendTicketApprovalNotification::dispatch($ticket); // Microsoft Graph email

        return response()->json($ticket->load('approvedBy', 'requester'));
    }

    /**
     * Reject a maintenance ticket (Admin only).
     */
    public function reject(Request $request, $id)
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        Gate::authorize('manage', MaintenanceTicket::class);

        $ticket = MaintenanceTicket::findOrFail($id);

        if ($ticket->status !== 'submitted') {
            return response()->json(['message' => 'Ticket cannot be rejected in current status'], 400);
        }

        $ticket->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        ActivityLogger::log('rejected', 'Ticket', $ticket->id, "Rejected ticket: {$ticket->title}");

        // ✅ Save in-app notification synchronously
        NotificationService::ticketRejected($ticket, $validated['rejection_reason']);

        // Queue Telegram (network I/O)
        SendTicketRejectedNotification::dispatch($ticket, $validated['rejection_reason']);

        return response()->json($ticket->load('requester'));
    }

    /**
     * Assign a technician to a ticket (Admin only).
     */
    public function assign(Request $request, $id)
    {
        $validated = $request->validate([
            'assigned_technician_id' => 'required|exists:profiles,id',
        ]);

        Gate::authorize('manage', MaintenanceTicket::class);

        $ticket = MaintenanceTicket::findOrFail($id);

        if (! in_array($ticket->status, ['submitted', 'approved'])) {
            return response()->json(['message' => 'Ticket cannot be assigned in current status'], 400);
        }

        // Domain isolation: ensure tickets are assigned to appropriate technicians
        $technician = Profile::find($validated['assigned_technician_id']);
        if ($technician) {
            $techDept = strtolower($technician->department ?? '');
            $techName = strtolower($technician->name ?? '');
            $techEmail = strtolower($technician->email ?? '');
            $isSapTech = str_contains($techDept, 'sap') || str_contains($techDept, 'erp') || str_contains($techName, 'sap') || str_contains($techEmail, 'sap');
            $isFacilityTech = str_contains($techDept, 'facility') || str_contains($techDept, 'facilities') || str_contains($techDept, 'maintenance') || str_contains($techDept, 'general') || str_contains($techDept, 'workplace') || str_contains($techName, 'facility') || str_contains($techEmail, 'facility');

            $category = $ticket->support_category ?? 'general';
            if ($category === 'sap' && ! $isSapTech) {
                return response()->json(['message' => 'This technician does not belong to the SAP support team.'], 422);
            }
            if ($category === 'it_support' && ($isSapTech || $isFacilityTech)) {
                return response()->json(['message' => 'This technician does not belong to the IT Support team.'], 422);
            }
            if ($category === 'general' && $isSapTech) {
                return response()->json(['message' => 'This technician belongs to the SAP team and cannot be assigned to Facility/General tickets.'], 422);
            }
        }

        $ticket->update([
            'status' => 'assigned',
            'assigned_technician_id' => $validated['assigned_technician_id'],
        ]);

        ActivityLogger::log('assigned', 'Ticket', $ticket->id, "Assigned ticket: {$ticket->title}");

        // ✅ Save in-app notifications synchronously
        NotificationService::ticketAssigned($ticket, $validated['assigned_technician_id']);

        // Queue Telegram (network I/O)
        SendTicketAssignedNotification::dispatch($ticket, $validated['assigned_technician_id']);

        return response()->json($ticket->load('assignedTechnician', 'requester'));
    }

    /**
     * Start working on a ticket (Technician).
     */
    public function start(Request $request, $id)
    {
        $ticket = MaintenanceTicket::findOrFail($id);
        Gate::authorize('update', $ticket);

        if ($ticket->status !== 'assigned') {
            return response()->json(['message' => 'Ticket cannot be started in current status'], 400);
        }

        $ticket->update([
            'status' => 'in_progress',
            'started_at' => now(),
        ]);

        ActivityLogger::log('started', 'Ticket', $ticket->id, "Started ticket: {$ticket->title}");

        return response()->json($ticket);
    }

    /**
     * Update ticket progress (Technician).
     */
    public function updateProgress(Request $request, $id)
    {
        $validated = $request->validate([
            'diagnosis' => 'nullable|string',
            'actions_taken' => 'nullable|string',
            'spare_parts' => 'nullable|array',
            'estimated_duration' => 'nullable|integer',
        ]);

        $ticket = MaintenanceTicket::findOrFail($id);
        Gate::authorize('update', $ticket);

        $ticket->update($validated);

        return response()->json($ticket);
    }

    /**
     * Mark ticket as completed (Technician).
     */
    public function complete(Request $request, $id)
    {
        $validated = $request->validate([
            'actions_taken' => 'required|string',
            'spare_parts' => 'nullable|array',
            'images' => 'nullable|array',
            'actual_duration' => 'nullable|integer',
        ]);

        $ticket = MaintenanceTicket::findOrFail($id);
        Gate::authorize('update', $ticket);

        if (! in_array($ticket->status, ['in_progress', 'reopened'])) {
            return response()->json(['message' => 'Ticket must be in progress or reopened to complete'], 400);
        }

        $ticket->update([
            ...$validated,
            'status' => 'completed_pending_review',
            'completed_date' => now(),
        ]);

        ActivityLogger::log('completed', 'Ticket', $ticket->id, "Completed ticket: {$ticket->title}");

        // ✅ Notify manager + super_admins synchronously that ticket needs review
        NotificationService::ticketCompletedPendingReview($ticket, auth()->id());

        // Notify the requester that their ticket is pending review
        if ($ticket->requester && $ticket->requester->user_id) {
            NotificationService::create(
                $ticket->requester->user_id,
                'Ticket Completed — Pending Review',
                "Your ticket '{$ticket->title}' has been marked as completed and is pending review.",
                'info',
                "/tickets/{$ticket->id}"
            );
        }

        return response()->json($ticket);
    }

    /**
     * Review ticket completion (Admin).
     */
    public function reviewCompletion(Request $request, $id)
    {
        $validated = $request->validate([
            'approved' => 'required|boolean',
            'notes' => 'nullable|string',
        ]);

        // Gate::authorize('manage', MaintenanceTicket::class);

        $ticket = MaintenanceTicket::findOrFail($id);

        // Allow Admin, Super Admin, OR Requester of the ticket
        if (! auth()->user()->hasAnyRole(['admin', 'super_admin']) && $ticket->requester_id !== auth()->user()->profile->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($ticket->status !== 'completed_pending_review') {
            return response()->json(['message' => 'Ticket is not pending review'], 400);
        }

        if ($validated['approved']) {
            $ticket->update([
                'status' => 'completed',
                'reviewed_by' => auth()->user()->profile->id,
                'reviewed_at' => now(),
            ]);
            ActivityLogger::log('reviewed', 'Ticket', $ticket->id, "Approved completion for ticket: {$ticket->title}");

            // ✅ Notify technician synchronously
            if ($ticket->assignedTechnician && $ticket->assignedTechnician->user_id) {
                NotificationService::create(
                    $ticket->assignedTechnician->user_id,
                    'Ticket Completion Approved',
                    "Great job! The completion of ticket '{$ticket->title}' has been approved.",
                    'success',
                    "/tickets/{$ticket->id}"
                );
            }
        } else {
            $ticket->update([
                'status' => 'reopened',
                'notes' => $ticket->notes."\n\nReview Notes: ".($validated['notes'] ?? 'Needs more work'),
            ]);
            ActivityLogger::log('reopened', 'Ticket', $ticket->id, "Reopened ticket: {$ticket->title}");

            // ✅ Notify technician + managers synchronously
            NotificationService::ticketReopened($ticket, auth()->id());

            // Notify the requester that completion was rejected
            if ($ticket->requester && $ticket->requester->user_id) {
                NotificationService::create(
                    $ticket->requester->user_id,
                    'Ticket Reopened',
                    "The completion of ticket '{$ticket->title}' was rejected. It has been reopened — please check the review notes.",
                    'warning',
                    "/tickets/{$ticket->id}"
                );
            }
        }

        return response()->json($ticket->load('reviewedBy', 'assignedTechnician'));
    }

    /**
     * Submit feedback for completed ticket (Requester).
     */
    public function submitFeedback(Request $request, $id)
    {
        $validated = $request->validate([
            'feedback_rating' => 'required|integer|min:1|max:5',
            'feedback_comment' => 'nullable|string',
        ]);

        $ticket = MaintenanceTicket::findOrFail($id);

        // Only requester can submit feedback
        if ($ticket->requester_id !== auth()->user()->profile->id) {
            return response()->json(['message' => 'Only the requester can submit feedback'], 403);
        }

        if ($ticket->status !== 'completed') {
            return response()->json(['message' => 'Can only provide feedback for completed tickets'], 400);
        }

        $ticket->update($validated);

        ActivityLogger::log('feedback', 'Ticket', $ticket->id, "Submitted feedback for ticket: {$ticket->title}");

        // ✅ Notify technician synchronously
        if ($ticket->assignedTechnician && $ticket->assignedTechnician->user_id) {
            NotificationService::create(
                $ticket->assignedTechnician->user_id,
                'New Feedback Received',
                "You received a {$validated['feedback_rating']}-star rating for ticket '{$ticket->title}'.",
                'info',
                "/tickets/{$ticket->id}"
            );
        }

        return response()->json($ticket);
    }

    /**
     * Resolve and assign the best manager for a given support category.
     * Result is cached for 5 minutes — routing rules rarely change and this
     * removes 3–4 queries from every ticket create/transfer request.
     */
    private function assignManagerForCategory(MaintenanceTicket $ticket, string $category): ?\App\Models\User
    {
        $cacheKey = "ticket_routing.manager.{$category}";

        // Cache::remember cannot persist null, so store a sentinel for "no manager"
        $managerId = Cache::remember($cacheKey, now()->addMinutes(1), fn () =>
            $this->resolveManagerForCategory($category)?->id ?? 0
        );

        $assigned = $managerId ? \App\Models\User::find($managerId) : null;

        // Stale entry: cached manager was deleted or lost its manager role/profile —
        // re-resolve live and refresh the cache before giving up
        if ($managerId && ! ($assigned && $assigned->profile && $assigned->hasAnyRole(['admin', 'super_admin']))) {
            $assigned = $this->resolveManagerForCategory($category);
            Cache::put($cacheKey, $assigned?->id ?? 0, now()->addMinutes(5));
        }

        if ($assigned && $assigned->profile) {
            $ticket->update(['assigned_manager_id' => $assigned->profile->id]);
            return $assigned;
        }

        return null;
    }

    /**
     * Drop cached manager-routing entries (call when users/roles change).
     */
    public static function forgetRoutingCache(): void
    {
        Cache::forget('ticket_routing.manager.it_support');
        Cache::forget('ticket_routing.manager.sap');
        Cache::forget('ticket_routing.manager.general');
    }

    private function resolveManagerForCategory(string $category): ?\App\Models\User
    {
        // -----------------------------------------------------------------------
        // Step 1: Explicit match — manager whose profile.support_category = category
        // Matches both 'admin' (Manager) and 'super_admin' roles.
        // -----------------------------------------------------------------------
        $explicit = \App\Models\User::role(['admin', 'super_admin'])
            ->whereHas('profile', fn($q) => $q->where('support_category', $category))
            ->with(['profile', 'roles'])
            ->first();

        if ($explicit) {
            return $explicit;
        }

        // -----------------------------------------------------------------------
        // Step 2: Intelligent heuristic fallback for managers with unassigned category
        // -----------------------------------------------------------------------
        $managers = \App\Models\User::role(['admin', 'super_admin'])
            ->whereHas('profile')
            ->with(['profile', 'roles'])
            ->get();

        if ($managers->isNotEmpty()) {
            $isSapUser = fn(\App\Models\User $user): bool =>
                str_contains(strtolower($user->profile?->department ?? ''), 'sap')
                || str_contains(strtolower($user->profile?->department ?? ''), 'erp')
                || str_contains(strtolower($user->profile?->department ?? ''), 'deployment')
                || str_contains(strtolower($user->name ?? ''), 'sap')
                || str_contains(strtolower($user->profile?->name ?? ''), 'sap')
                || str_contains(strtolower($user->email ?? ''), 'sap')
                || str_contains(strtolower($user->name ?? ''), 'deployment');

            $isFacilityUser = fn(\App\Models\User $user): bool =>
                str_contains(strtolower($user->profile?->department ?? ''), 'facility')
                || str_contains(strtolower($user->profile?->department ?? ''), 'facilities')
                || str_contains(strtolower($user->profile?->department ?? ''), 'maintenance')
                || str_contains(strtolower($user->profile?->department ?? ''), 'general')
                || str_contains(strtolower($user->profile?->department ?? ''), 'workplace')
                || str_contains(strtolower($user->profile?->department ?? ''), 'operations')
                || str_contains(strtolower($user->name ?? ''), 'facility')
                || str_contains(strtolower($user->email ?? ''), 'facility');

            $isItUser = function (\App\Models\User $user) use ($isSapUser): bool {
                if ($isSapUser($user)) {
                    return false;
                }
                $dept  = strtolower($user->profile?->department ?? '');
                $name  = strtolower($user->name ?? '');
                $email = strtolower($user->email ?? '');

                // Multi-word phrases matched as substrings.
                $itPhrases = ['it support', 'information technology', 'tech support', 'helpdesk', 'help desk', 'system admin', 'system administrator', 'ict department', 'ict support', 'computer services', 'computer service'];
                foreach ($itPhrases as $kw) {
                    if (str_contains($dept, $kw)) {
                        return true;
                    }
                }

                // Single-word tokens require word boundaries — avoids matching
                // unrelated words such as "citrix", "limited", or a generic
                // "support" department that isn't IT.
                $singleWords = ['it', 'tech', 'ict', 'system', 'network', 'computer', 'telecom'];
                $haystack = $dept . ' ' . $name . ' ' . $email;
                foreach ($singleWords as $kw) {
                    if (preg_match('/\b' . preg_quote($kw, '/') . '\b/i', $haystack)) {
                        return true;
                    }
                }

                return false;
            };

            $resolved = null;

            if ($category === 'sap') {
                $resolved = $managers->first(fn($u) => $isSapUser($u));
            } elseif ($category === 'it_support') {
                // Prioritize explicit IT manager match
                $resolved = $managers->first(fn($u) => $isItUser($u));

                // Fallback for IT: any admin who is NOT SAP and NOT Facility
                if (!$resolved) {
                    $resolved = $managers->first(fn($u) => $u->hasRole('admin') && !$isSapUser($u) && !$isFacilityUser($u));
                }

                // Super admin fallback if no dedicated IT admin exists
                if (!$resolved) {
                    $resolved = $managers->first(fn($u) => $u->hasRole('super_admin') && !$isSapUser($u));
                }
            } else {
                // general / facility
                $resolved = $managers->first(fn($u) => $isFacilityUser($u));

                if (!$resolved) {
                    $resolved = $managers->first(fn($u) => $u->hasRole('admin') && !$isSapUser($u));
                }
            }

            if ($resolved) {
                // Auto-backfill support_category on the profile so future lookups are immediate
                if ($resolved->profile && empty($resolved->profile->support_category)) {
                    $resolved->profile->update(['support_category' => $category]);
                }
                return $resolved;
            }
        }

        // -----------------------------------------------------------------------
        // Step 3: Absolute fallback (excludes SAP manager for IT tickets)
        // -----------------------------------------------------------------------
        $fallback = \App\Models\User::role('admin')
            ->whereHas('profile')
            ->with('profile')
            ->when($category === 'it_support', function ($q) {
                $q->whereDoesntHave('profile', function ($pq) {
                    $pq->where('department', 'like', '%sap%')
                       ->orWhere('department', 'like', '%erp%')
                       ->orWhere('name', 'like', '%sap%');
                });
            })
            ->first();

        if ($fallback) {
            return $fallback;
        }

        return \App\Models\User::role('super_admin')->whereHas('profile')->with('profile')->first();
    }

    /**
     * Transfer ticket to a different support department/category (Admin/Manager only).
     */
    public function transfer(Request $request, $id)
    {
        Gate::authorize('manage', MaintenanceTicket::class);

        $validated = $request->validate([
            'support_category' => 'required|in:it_support,sap,general',
            'reason'           => 'nullable|string|max:500',
        ]);

        $ticket = MaintenanceTicket::findOrFail($id);
        $oldCategory = $ticket->support_category ?? 'general';
        $newCategory = $validated['support_category'];

        if ($oldCategory === $newCategory) {
            return response()->json(['message' => 'Ticket is already in this department'], 422);
        }

        $ticket->update(['support_category' => $newCategory]);

        // Auto re-route to manager of the new department
        $newManager = $this->assignManagerForCategory($ticket, $newCategory);

        $categoryNames = [
            'it_support' => 'IT Support',
            'sap'        => 'System Related Issue',
            'general'    => 'General Support',
        ];
        $oldLabel = $categoryNames[$oldCategory] ?? $oldCategory;
        $newLabel = $categoryNames[$newCategory] ?? $newCategory;
        $reasonText = !empty($validated['reason']) ? " (Reason: {$validated['reason']})" : '';

        ActivityLogger::log('updated', 'Ticket', $ticket->id, "Transferred ticket from {$oldLabel} to {$newLabel}{$reasonText}");

        // Notify new assigned manager
        if ($newManager && (string)$newManager->id !== (string)auth()->id()) {
            $this->createNotification(
                $newManager->id,
                'Ticket Transferred to Your Department',
                "Ticket '{$ticket->title}' was re-routed to {$newLabel}{$reasonText}.",
                'info',
                "/tickets?id={$ticket->id}"
            );
        }

        // Notify requester
        if ($ticket->requester && $ticket->requester->user_id) {
            $this->createNotification(
                $ticket->requester->user_id,
                'Ticket Department Updated',
                "Your ticket '{$ticket->title}' has been re-routed from {$oldLabel} to {$newLabel}{$reasonText}.",
                'info',
                "/tickets?id={$ticket->id}"
            );
        }

        return response()->json($ticket->load('asset', 'requester', 'assignedTechnician', 'assignedManager'));
    }
}
