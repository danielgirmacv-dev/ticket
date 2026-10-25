<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\MaintenanceTicket;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SettingsController extends Controller
{
    public function index(Request $request)
    {
        if (! $request->user()->hasRole('super_admin')) {
            return response()->json(['message' => 'Unauthorized. Super admin only.'], 403);
        }

        $settings = Setting::all()->pluck('value', 'key');

        return response()->json([
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        if (! $request->user()->hasRole('super_admin')) {
            return response()->json(['message' => 'Unauthorized. Super admin only.'], 403);
        }

        $validated = $request->validate([
            'reminder_time' => 'sometimes|in:1,24,48,168',
            'auto_archive_days' => 'sometimes|in:7,30,90,never',
        ]);

        foreach ($validated as $key => $value) {
            Setting::set($key, $value);
        }

        return response()->json([
            'message' => 'Settings updated successfully.',
            'settings' => Setting::all()->pluck('value', 'key'),
        ]);
    }

    public function exportCsv(Request $request, string $type)
    {
        if (! $request->user()->hasRole('super_admin')) {
            return response()->json(['message' => 'Unauthorized. Super admin only.'], 403);
        }

        $filename = $type === 'tickets'
            ? 'maintenance-tickets-' . now()->format('Y-m-d') . '.csv'
            : 'assets-' . now()->format('Y-m-d') . '.csv';

        return (new StreamedResponse(function () use ($type) {
            $handle = fopen('php://output', 'w');

            if ($type === 'tickets') {
                fputcsv($handle, ['ID', 'Title', 'Type', 'Status', 'Priority', 'Requester', 'Assigned To', 'Category', 'Created At']);
                MaintenanceTicket::with(['requester', 'assignedTechnician'])->chunk(500, function ($tickets) use ($handle) {
                    foreach ($tickets as $ticket) {
                        fputcsv($handle, [
                            $ticket->id,
                            $ticket->title,
                            $ticket->type,
                            $ticket->status,
                            $ticket->priority,
                            $ticket->requester?->user?->name ?? $ticket->requester?->name ?? '',
                            $ticket->assignedTechnician?->user?->name ?? $ticket->assignedTechnician?->name ?? '',
                            $ticket->support_category ?? '',
                            $ticket->created_at,
                        ]);
                    }
                });
            } else {
                fputcsv($handle, ['ID', 'Name', 'Type', 'Serial Number', 'Status', 'Location', 'Created At']);
                \App\Models\Asset::chunk(500, function ($assets) use ($handle) {
                    foreach ($assets as $asset) {
                        fputcsv($handle, [
                            $asset->id,
                            $asset->name,
                            $asset->type,
                            $asset->serial_number,
                            $asset->status,
                            $asset->location,
                            $asset->created_at,
                        ]);
                    }
                });
            }

            fclose($handle);
        }))->withHeaders([
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    public function clearLogs(Request $request)
    {
        if (! $request->user()->hasRole('super_admin')) {
            return response()->json(['message' => 'Unauthorized. Super admin only.'], 403);
        }

        $deleted = ActivityLog::query()->delete();

        return response()->json([
            'message' => "Activity logs cleared ({$deleted} records deleted).",
        ]);
    }
}
