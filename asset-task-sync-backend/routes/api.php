<?php

use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MaintenanceTicketController;
use App\Http\Controllers\Api\MaintenanceScheduleController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\DepartmentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Telegram webhook (no auth required)
Route::post('/telegram/webhook', [App\Http\Controllers\Api\TelegramWebhookController::class, 'webhook']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/user/update-password', [AuthController::class, 'updatePassword']);
    Route::post('/users', [AuthController::class, 'storeUser']);
    Route::post('/users/{id}/approve', [AuthController::class, 'approveUser']);
    Route::post('/users/{id}/reject', [AuthController::class, 'rejectUser']);

    // Telegram
    Route::post('/telegram/generate-link', [App\Http\Controllers\Api\TelegramWebhookController::class, 'generateLink']);
    Route::delete('/telegram/unlink', [App\Http\Controllers\Api\TelegramWebhookController::class, 'unlink']);
    Route::get('/telegram/status', [App\Http\Controllers\Api\TelegramWebhookController::class, 'status']);

    // Assets
    Route::apiResource('assets', AssetController::class);
    Route::post('/assets/import-csv', [AssetController::class, 'importCsv']);

    // Locations & Departments
    Route::apiResource('locations', LocationController::class);
    Route::post('/locations/import-csv', [LocationController::class, 'importCsv']);

    Route::apiResource('departments', DepartmentController::class);
    Route::post('/departments/import-csv', [DepartmentController::class, 'importCsv']);

    // Maintenance Tickets
    Route::apiResource('maintenance-tickets', MaintenanceTicketController::class);

    // Maintenance Ticket Workflow Actions
    Route::post('/maintenance-tickets/{id}/approve', [MaintenanceTicketController::class, 'approve']);
    Route::post('/maintenance-tickets/{id}/reject', [MaintenanceTicketController::class, 'reject']);
    Route::post('/maintenance-tickets/{id}/assign', [MaintenanceTicketController::class, 'assign']);
    Route::post('/maintenance-tickets/{id}/start', [MaintenanceTicketController::class, 'start']);
    Route::post('/maintenance-tickets/{id}/update-progress', [MaintenanceTicketController::class, 'updateProgress']);
    Route::post('/maintenance-tickets/{id}/complete', [MaintenanceTicketController::class, 'complete']);
    Route::post('/maintenance-tickets/{id}/review-completion', [MaintenanceTicketController::class, 'reviewCompletion']);
    Route::post('/maintenance-tickets/{id}/feedback', [MaintenanceTicketController::class, 'submitFeedback']);

    // Maintenance Schedules (Preventive Maintenance)
    Route::apiResource('maintenance-schedules', MaintenanceScheduleController::class);

    // Notifications
    Route::apiResource('notifications', NotificationController::class);
    Route::patch('/notifications/{notification}/mark-read', [NotificationController::class, 'markAsRead']);

    // Profiles
    Route::apiResource('profiles', ProfileController::class)->only(['index', 'show', 'update', 'destroy']);
    Route::patch('/profiles/{profile}/role', [ProfileController::class, 'updateRole']);
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);

    // Reports
    Route::get('/reports/tickets', [ReportController::class, 'ticketReport']);
    Route::get('/reports/assets', [ReportController::class, 'assetReport']);
    Route::get('/reports/performance', [ReportController::class, 'performanceReport']);
    Route::get('/reports/export/tickets', [ReportController::class, 'exportTicketsCsv']);
    Route::get('/reports/export/assets', [ReportController::class, 'exportAssetsCsv']);
});

