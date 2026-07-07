<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, modify the status enum to include both old and new values
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE maintenance_tickets MODIFY COLUMN status ENUM('pending', 'submitted', 'approved', 'rejected', 'assigned', 'in_progress', 'completed_pending_review', 'completed', 'reopened', 'cancelled') DEFAULT 'submitted'");
        }

        // Then update existing 'pending' status to 'submitted'
        DB::table('maintenance_tickets')
            ->where('status', 'pending')
            ->update(['status' => 'submitted']);

        // Add new workflow-related fields
        Schema::table('maintenance_tickets', function (Blueprint $table) {
            $table->text('rejection_reason')->nullable()->after('notes');
            $table->text('diagnosis')->nullable()->after('rejection_reason');
            $table->text('actions_taken')->nullable()->after('diagnosis');
            $table->json('spare_parts')->nullable()->after('actions_taken');
            $table->json('images')->nullable()->after('spare_parts');
            $table->integer('feedback_rating')->nullable()->after('images');
            $table->text('feedback_comment')->nullable()->after('feedback_rating');
            $table->uuid('approved_by')->nullable()->after('feedback_comment');
            $table->uuid('reviewed_by')->nullable()->after('approved_by');
            $table->timestamp('approved_at')->nullable()->after('reviewed_by');
            $table->timestamp('started_at')->nullable()->after('approved_at');
            $table->timestamp('reviewed_at')->nullable()->after('started_at');

            // Add foreign keys
            $table->foreign('approved_by')->references('id')->on('profiles')->onDelete('set null');
            $table->foreign('reviewed_by')->references('id')->on('profiles')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('maintenance_tickets', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropForeign(['reviewed_by']);

            $table->dropColumn([
                'rejection_reason',
                'diagnosis',
                'actions_taken',
                'spare_parts',
                'images',
                'feedback_rating',
                'feedback_comment',
                'approved_by',
                'reviewed_by',
                'approved_at',
                'started_at',
                'reviewed_at',
            ]);
        });

        // Revert status enum to original values
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE maintenance_tickets MODIFY COLUMN status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending'");
        }

        // Revert 'submitted' back to 'pending'
        DB::table('maintenance_tickets')
            ->where('status', 'submitted')
            ->update(['status' => 'pending']);
    }
};
