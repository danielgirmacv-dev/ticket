<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MaintenanceSchedule;
use Illuminate\Http\Request;

class MaintenanceScheduleController extends Controller
{
    /**
     * Display a listing of maintenance schedules.
     */
    public function index(Request $request)
    {
        $query = MaintenanceSchedule::with('asset', 'creator');

        // Filter by asset
        if ($request->has('asset_id')) {
            $query->where('asset_id', $request->asset_id);
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $schedules = $query->orderBy('next_run_date', 'asc')->get();

        return response()->json($schedules);
    }

    /**
     * Store a newly created maintenance schedule.
     */
    public function store(Request $request)
    {
        // Only admins can create schedules
        if (! auth()->user()->hasAnyRole(['admin', 'super_admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'asset_id' => 'required|exists:assets,id',
            'type' => 'required|in:maintenance,inspection,other',
            'frequency' => 'required|in:daily,weekly,monthly,quarterly,yearly',
            'next_run_date' => 'required|date',
        ]);

        $validated['created_by'] = auth()->user()->profile->id;

        $schedule = MaintenanceSchedule::create($validated);

        return response()->json($schedule->load('asset', 'creator'), 201);
    }

    /**
     * Display the specified maintenance schedule.
     */
    public function show(MaintenanceSchedule $maintenanceSchedule)
    {
        return response()->json($maintenanceSchedule->load('asset', 'creator'));
    }

    /**
     * Update the specified maintenance schedule.
     */
    public function update(Request $request, MaintenanceSchedule $maintenanceSchedule)
    {
        // Only admins can update schedules
        if (! auth()->user()->hasAnyRole(['admin', 'super_admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'asset_id' => 'sometimes|exists:assets,id',
            'type' => 'sometimes|in:maintenance,inspection,other',
            'frequency' => 'sometimes|in:daily,weekly,monthly,quarterly,yearly',
            'next_run_date' => 'sometimes|date',
            'is_active' => 'sometimes|boolean',
        ]);

        $maintenanceSchedule->update($validated);

        return response()->json($maintenanceSchedule->load('asset', 'creator'));
    }

    /**
     * Remove the specified maintenance schedule.
     */
    public function destroy(MaintenanceSchedule $maintenanceSchedule)
    {
        // Only admins can delete schedules
        if (! auth()->user()->hasAnyRole(['admin', 'super_admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $maintenanceSchedule->delete();

        return response()->json(null, 204);
    }
}
