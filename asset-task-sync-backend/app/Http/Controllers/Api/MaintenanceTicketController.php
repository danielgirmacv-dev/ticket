<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MaintenanceTicket;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
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

        $tickets = $query->orderBy('scheduled_date', 'asc')->get();

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

        // Default category to 'general' if not provided
        if (! isset($validated['support_category'])) {
            $validated['support_category'] = 'general';
        }

        // Auto-set requester_id to authenticated user's profile if not provided
        if (! isset($validated['requester_id'])) {
            $validated['requester_id'] = auth()->user()->profile->id;
        }

        // Restrict multiple pending requests for requesters
        if (auth()->user()->hasRole('requester')) {
            $existingPendingTicket = MaintenanceTicket::where('requester_id', $validated['requester_id'])
                ->whereIn('status', ['submitted', 'assigned', 'in_progress'])
                ->exists();

            if ($existingPendingTicket) {
                return response()->json([
                    'message' => 'You already have a pending request. Please wait for it to be completed before submitting a new one.',
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
        try {
            $category = $ticket->support_category ?? 'general';

            // Department keyword map — matches manager's profile->department field
            $categoryDeptMap = [
                'it_support' => 'IT Support',
                'sap'        => 'SAP',
            ];

            $assignedManager = null;

            if (isset($categoryDeptMap[$category])) {
                $deptKeyword = $categoryDeptMap[$category];

                // Find an admin whose department contains the keyword (case-insensitive)
                $matchingManager = \App\Models\User::role('admin')
                    ->whereHas('profile', fn($q) => $q->whereRaw('LOWER(department) LIKE ?', ['%' . strtolower($deptKeyword) . '%']))
                    ->first();

                if ($matchingManager) {
                    $assignedManager = $matchingManager;
                    // Set the assigned_manager_id on the ticket
                    $ticket->update(['assigned_manager_id' => $matchingManager->profile->id]);
                }
            }

            // If no category-specific manager found, fall back to location-based routing
            if (! $assignedManager) {
                $requesterProfile  = \App\Models\Profile::find($ticket->requester_id);
                $requesterLocationId = $requesterProfile?->location_id;

                $notifyUsers = collect();
                if ($requesterLocationId) {
                    $locationManagers    = \App\Models\User::role('admin')
                        ->whereHas('profile', fn($q) => $q->where('location_id', $requesterLocationId))->get();
                    $locationSuperAdmins = \App\Models\User::role('super_admin')
                        ->whereHas('profile', fn($q) => $q->where('location_id', $requesterLocationId))->get();
                    $notifyUsers = $locationManagers->merge($locationSuperAdmins);
                }

                if ($notifyUsers->isEmpty()) {
                    $notifyUsers = \App\Models\User::role('admin')->get()
                        ->merge(\App\Models\User::role('super_admin')->get());
                }

                // Assign the first manager found as the ticket owner
                $firstManager = $notifyUsers->first(fn($u) => $u->profile?->id !== $ticket->requester_id);
                if ($firstManager) {
                    $ticket->update(['assigned_manager_id' => $firstManager->profile->id]);
                    $assignedManager = $firstManager;
                    $notifyUsers = collect([$firstManager]);
                }

                foreach ($notifyUsers as $manager) {
                    if ($manager->profile?->id !== $ticket->requester_id) {
                        $this->createNotification(
                            $manager->id,
                            'New Maintenance Request',
                            "A new ticket '{$ticket->title}' has been submitted by {$ticket->requester?->name}.",
                            'info',
                            "/tickets/{$ticket->id}"
                        );
                    }
                }
            } else {
                // Notify the category-matched manager
                $categoryLabel = $category === 'it_support' ? 'IT Support' : 'SAP';
                $this->createNotification(
                    $assignedManager->id,
                    "New {$categoryLabel} Request",
                    "A new {$categoryLabel} ticket '{$ticket->title}' has been routed to you.",
                    'info',
                    "/tickets/{$ticket->id}"
                );
            }

            // Always notify super_admins so they have full visibility
            \App\Models\User::role('super_admin')->each(function ($superAdmin) use ($ticket) {
                if ($superAdmin->profile?->id !== $ticket->requester_id) {
                    $this->createNotification(
                        $superAdmin->id,
                        'New Maintenance Request',
                        "Ticket '{$ticket->title}' submitted — routed to assigned manager.",
                        'info',
                        "/tickets/{$ticket->id}"
                    );
                }
            });

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to route ticket: ' . $e->getMessage());
        }

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
            \Illuminate\Support\Facades\Log::error('Failed to create notification: '.$e->getMessage());
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

        // Notify Requester
        if ($ticket->requester && $ticket->requester->user_id) {
            $this->createNotification(
                $ticket->requester->user_id,
                'Ticket Approved',
                "Your ticket '{$ticket->title}' has been approved.",
                'success',
                "/tickets/{$ticket->id}"
            );
        }

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

        // Notify Requester
        if ($ticket->requester && $ticket->requester->user_id) {
            $this->createNotification(
                $ticket->requester->user_id,
                'Ticket Rejected',
                "Your ticket '{$ticket->title}' was rejected. Reason: {$validated['rejection_reason']}",
                'error',
                "/tickets/{$ticket->id}"
            );
        }

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

        $ticket->update([
            'status' => 'assigned',
            'assigned_technician_id' => $validated['assigned_technician_id'],
        ]);

        ActivityLogger::log('assigned', 'Ticket', $ticket->id, "Assigned ticket: {$ticket->title}");

        // Notify Technician
        $technicianProfile = \App\Models\Profile::find($validated['assigned_technician_id']);
        if ($technicianProfile && $technicianProfile->user_id) {
            $this->createNotification(
                $technicianProfile->user_id,
                'New Ticket Assigned',
                "You have been assigned to ticket '{$ticket->title}'.",
                'info',
                "/tickets/{$ticket->id}"
            );
        }

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

        // Notify Admin (and Requester optionally)
        // Find admins to notify? For now, maybe just log it or rely on admin checking dashboard.
        // But we should notify the Requester that it's done pending review.
        if ($ticket->requester && $ticket->requester->user_id) {
            $this->createNotification(
                $ticket->requester->user_id,
                'Ticket Completed (Pending Review)',
                "Ticket '{$ticket->title}' has been marked as completed and is pending review.",
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

            // Notify Technician
            if ($ticket->assignedTechnician && $ticket->assignedTechnician->user_id) {
                $this->createNotification(
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

            // Notify Technician
            if ($ticket->assignedTechnician && $ticket->assignedTechnician->user_id) {
                $this->createNotification(
                    $ticket->assignedTechnician->user_id,
                    'Ticket Reopened',
                    "Ticket '{$ticket->title}' has been reopened. Please check review notes.",
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

        // Notify Technician
        if ($ticket->assignedTechnician && $ticket->assignedTechnician->user_id) {
            $this->createNotification(
                $ticket->assignedTechnician->user_id,
                'New Feedback Received',
                "You received a {$validated['feedback_rating']}-star rating for ticket '{$ticket->title}'.",
                'info',
                "/tickets/{$ticket->id}"
            );
        }

        return response()->json($ticket);
    }
}
