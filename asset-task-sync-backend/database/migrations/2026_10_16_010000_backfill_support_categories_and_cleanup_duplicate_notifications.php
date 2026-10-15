<?php

use App\Http\Controllers\Api\MaintenanceTicketController;
use App\Models\Notification;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // ---------------------------------------------------------------------
        // 1. Backfill support_category for existing managers
        // ---------------------------------------------------------------------
        $managers = User::role(['admin', 'super_admin'])->with('profile')->get();

        foreach ($managers as $user) {
            $profile = $user->profile;
            if (!$profile || !empty($profile->support_category)) {
                continue;
            }

            $dept  = strtolower($profile->department ?? '');
            $name  = strtolower($user->name ?? '');
            $email = strtolower($user->email ?? '');

            $isSap = str_contains($dept, 'sap')
                || str_contains($dept, 'erp')
                || str_contains($dept, 'deployment')
                || str_contains($name, 'sap')
                || str_contains($email, 'sap')
                || str_contains($name, 'deployment');

            $isFacility = str_contains($dept, 'facility')
                || str_contains($dept, 'facilities')
                || str_contains($dept, 'maintenance')
                || str_contains($dept, 'general')
                || str_contains($dept, 'workplace')
                || str_contains($dept, 'operations')
                || str_contains($name, 'facility')
                || str_contains($email, 'facility');

            $isIt = !$isSap && !$isFacility && (
                str_contains($dept, 'it')
                || str_contains($dept, 'tech')
                || str_contains($dept, 'information technology')
                || str_contains($dept, 'helpdesk')
                || str_contains($dept, 'system')
                || str_contains($dept, 'network')
                || str_contains($dept, 'ict')
                || str_contains($dept, 'computer')
                || str_contains($dept, 'support')
                || str_contains($name, 'it')
                || str_contains($email, 'it')
                || str_contains($email, 'tech')
            );

            if ($isSap) {
                $profile->update(['support_category' => 'sap']);
            } elseif ($isFacility) {
                $profile->update(['support_category' => 'general']);
            } elseif ($isIt) {
                $profile->update(['support_category' => 'it_support']);
            }
        }

        // ---------------------------------------------------------------------
        // 2. Remove existing duplicate notifications created at the same time
        // ---------------------------------------------------------------------
        try {
            $grouped = Notification::select('id', 'user_id', 'title', 'created_at')
                ->orderBy('created_at', 'asc')
                ->get()
                ->groupBy(fn ($n) => $n->user_id . '|' . $n->title . '|' . ($n->created_at ? $n->created_at->format('Y-m-d H:i') : ''));

            $deleteIds = [];
            foreach ($grouped as $group) {
                if ($group->count() > 1) {
                    foreach ($group->slice(1) as $dup) {
                        $deleteIds[] = $dup->id;
                    }
                }
            }

            if (!empty($deleteIds)) {
                Notification::whereIn('id', $deleteIds)->delete();
            }
        } catch (\Throwable $e) {
            // Non-critical cleanup
        }

        // ---------------------------------------------------------------------
        // 3. Invalidate routing cache so new categories take effect immediately
        // ---------------------------------------------------------------------
        MaintenanceTicketController::forgetRoutingCache();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No destructive reversal needed
    }
};
