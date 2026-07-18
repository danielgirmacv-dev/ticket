<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index()
    {
        $departments = Department::orderBy('name')->get();

        return response()->json($departments);
    }

    public function store(Request $request)
    {
        if (! $request->user()->hasAnyRole(['admin', 'super_admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:departments,name',
            'description' => 'nullable|string',
        ]);

        $department = Department::create($validated);

        ActivityLogger::log('created', 'Department', $department->id, "Created department: {$department->name}");

        return response()->json($department, 201);
    }

    public function show(Department $department)
    {
        return response()->json($department);
    }

    public function update(Request $request, Department $department)
    {
        if (! $request->user()->hasAnyRole(['admin', 'super_admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255|unique:departments,name,'.$department->id,
            'description' => 'nullable|string',
        ]);

        $department->update($validated);

        ActivityLogger::log('updated', 'Department', $department->id, "Updated department: {$department->name}");

        return response()->json($department);
    }

    public function destroy(Request $request, Department $department)
    {
        if (! $request->user()->hasAnyRole(['admin', 'super_admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $department->delete();

        ActivityLogger::log('deleted', 'Department', $department->id, "Deleted department: {$department->name}");

        return response()->json(null, 204);
    }

    /**
     * Import departments from CSV file.
     */
    public function importCsv(Request $request)
    {
        if (! $request->user()->hasAnyRole(['admin', 'super_admin'])) {
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

        if (! empty($missingHeaders)) {
            fclose($handle);

            return response()->json([
                'error' => 'Missing required CSV headers: '.implode(', ', $missingHeaders),
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
                        'description' => 'nullable|string',
                    ])->validate();

                    Department::updateOrCreate([
                        'name' => $validated['name'],
                    ], [
                        'description' => $validated['description'] ?? null,
                    ]);

                    $successCount++;

                } catch (\Illuminate\Validation\ValidationException $e) {
                    $errors[] = [
                        'row' => $row,
                        'data' => $rowData,
                        'errors' => $e->errors(),
                    ];
                } catch (\Exception $e) {
                    $errors[] = [
                        'row' => $row,
                        'data' => $rowData,
                        'errors' => ['general' => [$e->getMessage()]],
                    ];
                }
            }

            fclose($handle);

            if (! empty($errors) && $successCount === 0) {
                \DB::rollBack();

                return response()->json([
                    'message' => 'CSV import failed. No departments were imported.',
                    'success_count' => 0,
                    'error_count' => count($errors),
                    'errors' => $errors,
                ], 422);
            }

            \DB::commit();

            ActivityLogger::log('imported', 'Department', null, "Imported {$successCount} departments from CSV");

            return response()->json([
                'message' => "Successfully imported {$successCount} departments".(count($errors) > 0 ? ' with '.count($errors).' errors' : ''),
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
