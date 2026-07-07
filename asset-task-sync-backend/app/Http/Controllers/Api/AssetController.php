<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class AssetController extends Controller
{
    /**
     * Display a listing of assets.
     */
    public function index(Request $request)
    {
        // Gate::authorize('viewAny', Asset::class); // Optional

        $query = Asset::with('assignedUser', 'maintenanceTickets');

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Search by name or serial number
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('serial_number', 'like', "%{$search}%");
            });
        }

        $assets = $query->orderBy('created_at', 'desc')->get();

        return response()->json($assets);
    }

    /**
     * Store a newly created asset.
     */
    public function store(Request $request)
    {
        Gate::authorize('create', Asset::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:computer,printer,server,network_device,other',
            'serial_number' => 'required|string|unique:assets',
            'purchase_date' => 'required|date',
            'warranty_expiry' => 'nullable|date',
            'location' => 'required|string',
            'status' => 'required|in:active,maintenance,retired,disposed',
            'assigned_to' => 'nullable|uuid|exists:profiles,id',
            'notes' => 'nullable|string',
        ]);

        $asset = Asset::create($validated);

        ActivityLogger::log('created', 'Asset', $asset->id, "Created asset: {$asset->name}");

        return response()->json($asset->load('assignedUser'), 201);
    }

    /**
     * Display the specified asset.
     */
    public function show(Asset $asset)
    {
        Gate::authorize('view', $asset);

        return response()->json($asset->load('assignedUser', 'maintenanceTickets'));
    }

    /**
     * Update the specified asset.
     */
    public function update(Request $request, Asset $asset)
    {
        Gate::authorize('update', $asset);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:computer,printer,server,network_device,other',
            'serial_number' => 'sometimes|string|unique:assets,serial_number,'.$asset->id,
            'purchase_date' => 'sometimes|date',
            'warranty_expiry' => 'nullable|date',
            'location' => 'sometimes|string',
            'status' => 'sometimes|in:active,maintenance,retired,disposed',
            'assigned_to' => 'nullable|uuid|exists:profiles,id',
            'notes' => 'nullable|string',
        ]);

        $asset->update($validated);

        ActivityLogger::log('updated', 'Asset', $asset->id, "Updated asset: {$asset->name}");

        return response()->json($asset->load('assignedUser'));
    }

    /**
     * Remove the specified asset.
     */
    public function destroy(Asset $asset)
    {
        Gate::authorize('delete', $asset);

        $asset->delete();

        ActivityLogger::log('deleted', 'Asset', $asset->id, "Deleted asset: {$asset->name}");

        return response()->json(null, 204);
    }

    /**
     * Import assets from CSV file.
     */
    public function importCsv(Request $request)
    {
        Gate::authorize('create', Asset::class);

        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:10240', // Max 10MB
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');

        $header = fgetcsv($handle);

        // Validate CSV headers
        $requiredHeaders = ['name', 'type', 'serial_number', 'purchase_date', 'location', 'status'];
        $missingHeaders = array_diff($requiredHeaders, $header);

        if (! empty($missingHeaders)) {
            fclose($handle);

            return response()->json([
                'error' => 'Missing required CSV headers: '.implode(', ', $missingHeaders),
            ], 422);
        }

        $successCount = 0;
        $errors = [];
        $row = 1; // Start at 1 (header is row 0)

        \DB::beginTransaction();

        try {
            while (($data = fgetcsv($handle)) !== false) {
                $row++;

                // Map CSV data to array
                $assetData = array_combine($header, $data);

                // Validate and prepare data
                try {
                    $validated = validator($assetData, [
                        'name' => 'required|string|max:255',
                        'type' => 'required|in:computer,printer,server,network_device,other',
                        'serial_number' => 'required|string|unique:assets',
                        'purchase_date' => 'required|date',
                        'warranty_expiry' => 'nullable|date',
                        'location' => 'required|string',
                        'status' => 'required|in:active,maintenance,retired,disposed',
                        'assigned_to' => 'nullable|uuid|exists:profiles,id',
                        'notes' => 'nullable|string',
                    ])->validate();

                    Asset::create($validated);
                    $successCount++;

                } catch (\Illuminate\Validation\ValidationException $e) {
                    $errors[] = [
                        'row' => $row,
                        'data' => $assetData,
                        'errors' => $e->errors(),
                    ];
                } catch (\Exception $e) {
                    $errors[] = [
                        'row' => $row,
                        'data' => $assetData,
                        'errors' => ['general' => [$e->getMessage()]],
                    ];
                }
            }

            fclose($handle);

            // If there are errors, rollback and return them
            if (! empty($errors) && $successCount === 0) {
                \DB::rollBack();

                return response()->json([
                    'message' => 'CSV import failed. No assets were imported.',
                    'success_count' => 0,
                    'error_count' => count($errors),
                    'errors' => $errors,
                ], 422);
            }

            \DB::commit();

            ActivityLogger::log('imported', 'Asset', null, "Imported {$successCount} assets from CSV");

            return response()->json([
                'message' => "Successfully imported {$successCount} assets".
                    (count($errors) > 0 ? ' with '.count($errors).' errors' : ''),
                'success_count' => $successCount,
                'error_count' => count($errors),
                'errors' => $errors,
            ], 200);

        } catch (\Exception $e) {
            \DB::rollBack();
            fclose($handle);

            return response()->json([
                'error' => 'Failed to process CSV file: '.$e->getMessage(),
            ], 500);
        }
    }
}
