<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('maintenance_tickets', function (Blueprint $table) {
            // Category for smart routing: it_support → IT Support Manager, sap → SAP Deployment Manager
            $table->enum('support_category', ['it_support', 'sap', 'general'])->default('general')->after('type');
            // The manager profile this ticket is routed to
            $table->uuid('assigned_manager_id')->nullable()->after('assigned_technician_id');
            $table->foreign('assigned_manager_id')->references('id')->on('profiles')->onDelete('set null');
            $table->index('assigned_manager_id');
            $table->index('support_category');
        });
    }

    public function down(): void
    {
        Schema::table('maintenance_tickets', function (Blueprint $table) {
            $table->dropForeign(['assigned_manager_id']);
            $table->dropColumn(['support_category', 'assigned_manager_id']);
        });
    }
};
