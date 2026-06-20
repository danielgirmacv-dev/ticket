<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Location;
use Illuminate\Http\Request;
use App\Services\ActivityLogger;

class LocationController extends Controller
{
    public function index()
    {
        $locations = Location::orderBy('name')->get();
        return response()->json($locations);
    }

    public function store(Request $request)
    {
        if (!$request->user()->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:locations,name',
            'address' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);

        $location = Location::create($validated);

        ActivityLogger::log('created', 'Location', $location->id, "Created location: {$location->name}");

        return response()->json($location, 201);
    }

    public function show(Location $location)
    {
        return response()->json($location);
    }

    /**
     * Return profiles/users that belong to this location.
     */
    public function profiles(Location $location)
    {
        $profiles = $location->profiles()->with(['user' => function ($query) {
            $query->select('id', 'name', 'email');
        }, 'user.roles'])->get();

        return response()->json($profiles);
    }

    public function update(Request $request, Location $location)
    {
        if (!$request->user()->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255|unique:locations,name,' . $location->id,
            'address' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);

        $location->update($validated);

        ActivityLogger::log('updated', 'Location', $location->id, "Updated location: {$location->name}");

        return response()->json($location);
    }

    public function destroy(Request $request, Location $location)
    {
        if (!$request->user()->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $location->delete();

        ActivityLogger::log('deleted', 'Location', $location->id, "Deleted location: {$location->name}");

        return response()->json(null, 204);
    }

    /**
     * Import locations from CSV file.
     */
    public function importCsv(Request $request)
    {
        if (!$request->user()->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:10240',
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');

        $header = fgetcsv($handle);

        $requiredHeaders = ['name'];
        $missingHeaders = array_diff($requiredHeaders, $header ?: []);

        if (!empty($missingHeaders)) {
            fclose($handle);
            return response()->json([
                'error' => 'Missing required CSV headers: ' . implode(', ', $missingHeaders)
            ], 422);
        }

        $successCount = 0;
        $errors = [];
        $row = 1;

        \DB::beginTransaction();

        try {
            while (($data = fgetcsv($handle)) !== false) {
                $row++;
                $rowData = array_combine($header, $data);

                try {
                    $validated = validator($rowData, [
                        'name' => 'required|string|max:255',
                        'address' => 'nullable|string|max:255',
                        'description' => 'nullable|string',
                    ])->validate();

                    // Create or update by name
                    Location::updateOrCreate([
                        'name' => $validated['name']
                    ], [
                        'address' => $validated['address'] ?? null,
                        'description' => $validated['description'] ?? null,
                    ]);

                    $successCount++;

                } catch (\Illuminate\Validation\ValidationException $e) {
                    $errors[] = [
                        'row' => $row,
                        'data' => $rowData,
                        'errors' => $e->errors()
                    ];
                } catch (\Exception $e) {
                    $errors[] = [
                        'row' => $row,
                        'data' => $rowData,
                        'errors' => ['general' => [$e->getMessage()]]
                    ];
                }
            }

            fclose($handle);

            if (!empty($errors) && $successCount === 0) {
                \DB::rollBack();
                return response()->json([
                    'message' => 'CSV import failed. No locations were imported.',
                    'success_count' => 0,
                    'error_count' => count($errors),
                    'errors' => $errors
                ], 422);
            }

            \DB::commit();

            ActivityLogger::log('imported', 'Location', null, "Imported {$successCount} locations from CSV");

            return response()->json([
                'message' => "Successfully imported {$successCount} locations" . (count($errors) > 0 ? " with " . count($errors) . " errors" : ""),
                'success_count' => $successCount,
                'error_count' => count($errors),
                'errors' => $errors
            ], 200);

        } catch (\Exception $e) {
            \DB::rollBack();
            fclose($handle);

            return response()->json([
                'error' => 'Failed to process CSV file: ' . $e->getMessage()
            ], 500);
        }
    }
}
