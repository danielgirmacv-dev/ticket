<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\MaintenanceTicket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Get ticket report with filters.
     */
    public function ticketReport(Request $request)
    {
        $query = MaintenanceTicket::with('asset', 'requester', 'assignedTechnician');

        // Apply filters
        if ($request->has('start_date')) {
            $query->where('scheduled_date', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->where('scheduled_date', '<=', $request->end_date);
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->has('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        if ($request->has('asset_id')) {
            $query->where('asset_id', $request->asset_id);
        }

        if ($request->has('assigned_technician_id')) {
            $query->where('assigned_technician_id', $request->assigned_technician_id);
        }

        $tickets = $query->orderBy('scheduled_date', 'desc')->get();

        return response()->json($tickets);
    }

    /**
     * Get asset report with filters.
     */
    public function assetReport(Request $request)
    {
        $query = Asset::with('assignedUser', 'maintenanceTickets');

        // Apply filters
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->has('location')) {
            $query->where('location', 'like', '%'.$request->location.'%');
        }

        $assets = $query->orderBy('created_at', 'desc')->get();

        return response()->json($assets);
    }

    /**
     * Get performance metrics and statistics.
     */
    public function performanceReport(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $query = MaintenanceTicket::query();

        if ($startDate) {
            $query->where('scheduled_date', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('scheduled_date', '<=', $endDate);
        }

        $totalTickets = $query->count();
        $completedTickets = (clone $query)->where('status', 'completed')->count();
        $inProgressTickets = (clone $query)->where('status', 'in_progress')->count();
        $overdueQuery = (clone $query)->where('scheduled_date', '<', now())
            ->whereNotIn('status', ['completed', 'cancelled']);
        $overdueTickets = $overdueQuery->count();

        // Tickets by status
        $ticketsByStatus = (clone $query)->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get();

        // Tickets by priority
        $ticketsByPriority = (clone $query)->select('priority', DB::raw('count(*) as count'))
            ->groupBy('priority')
            ->get();

        // Tickets by type
        $ticketsByType = (clone $query)->select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->get();

        // Average completion time (in days) for completed tickets
        $avgCompletionTime = (clone $query)->where('status', 'completed')
            ->whereNotNull('completed_date')
            ->select(DB::raw('AVG(DATEDIFF(completed_date, scheduled_date)) as avg_days'))
            ->value('avg_days');

        // Technician Performance Stats
        $technicianStats = (clone $query)
            ->whereNotNull('assigned_technician_id')
            ->select(
                'assigned_technician_id',
                DB::raw('count(*) as total_assigned'),
                DB::raw('sum(case when status = "completed" then 1 else 0 end) as completed_count'),
                DB::raw('avg(feedback_rating) as avg_rating'),
                DB::raw('avg(case when status = "completed" AND completed_date IS NOT NULL AND scheduled_date IS NOT NULL then DATEDIFF(completed_date, scheduled_date) else null end) as avg_completion_days')
            )
            ->groupBy('assigned_technician_id')
            ->with('assignedTechnician')
            ->get();

        return response()->json([
            'summary' => [
                'total_tickets' => $totalTickets,
                'completed_tickets' => $completedTickets,
                'in_progress_tickets' => $inProgressTickets,
                'overdue_tickets' => $overdueTickets,
                'completion_rate' => $totalTickets > 0 ? round(($completedTickets / $totalTickets) * 100, 2) : 0,
                'avg_completion_days' => round($avgCompletionTime ?? 0, 1),
            ],
            'tickets_by_status' => $ticketsByStatus,
            'tickets_by_priority' => $ticketsByPriority,
            'tickets_by_type' => $ticketsByType,
            'technician_stats' => $technicianStats,
        ]);
    }

    /**
     * Export tickets to CSV.
     */
    public function exportTicketsCsv(Request $request)
    {
        $query = MaintenanceTicket::with('asset', 'requester', 'assignedTechnician');

        // Apply same filters as ticketReport
        if ($request->has('start_date')) {
            $query->where('scheduled_date', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->where('scheduled_date', '<=', $request->end_date);
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->has('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        $tickets = $query->orderBy('scheduled_date', 'desc')->get();

        // Generate CSV
        $filename = 'tickets_report_'.date('Y-m-d_His').'.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ];

        $callback = function () use ($tickets) {
            $file = fopen('php://output', 'w');

            // CSV Headers
            fputcsv($file, [
                'ID',
                'Title',
                'Type',
                'Status',
                'Priority',
                'Asset',
                'Requester',
                'Assigned To',
                'Scheduled Date',
                'Completed Date',
                'Created At',
            ]);

            // CSV Data
            foreach ($tickets as $ticket) {
                fputcsv($file, [
                    $ticket->id,
                    $ticket->title,
                    $ticket->type,
                    $ticket->status,
                    $ticket->priority,
                    $ticket->asset->name ?? 'N/A',
                    $ticket->requester->name ?? 'N/A',
                    $ticket->assignedTechnician->name ?? 'Not Assigned',
                    $ticket->scheduled_date,
                    $ticket->completed_date ?? 'N/A',
                    $ticket->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export assets to CSV.
     */
    public function exportAssetsCsv(Request $request)
    {
        $query = Asset::with('assignedUser');

        // Apply filters
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        $assets = $query->orderBy('created_at', 'desc')->get();

        // Generate CSV
        $filename = 'assets_report_'.date('Y-m-d_His').'.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ];

        $callback = function () use ($assets) {
            $file = fopen('php://output', 'w');

            // CSV Headers
            fputcsv($file, [
                'ID',
                'Name',
                'Type',
                'Status',
                'Serial Number',
                'Location',
                'Assigned To',
                'Purchase Date',
                'Warranty Expiry',
                'Created At',
            ]);

            // CSV Data
            foreach ($assets as $asset) {
                fputcsv($file, [
                    $asset->id,
                    $asset->name,
                    $asset->type,
                    $asset->status,
                    $asset->serial_number,
                    $asset->location,
                    $asset->assignedUser->name ?? 'Not Assigned',
                    $asset->purchase_date,
                    $asset->warranty_expiry ?? 'N/A',
                    $asset->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
