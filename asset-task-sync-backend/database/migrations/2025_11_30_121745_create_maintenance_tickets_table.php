<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('maintenance_tickets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['maintenance', 'repair', 'installation', 'inspection', 'other']);
            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->uuid('asset_id');
            $table->uuid('requester_id')->nullable();
            $table->uuid('assigned_technician_id')->nullable();
            $table->timestamp('scheduled_date');
            $table->timestamp('completed_date')->nullable();
            $table->integer('estimated_duration')->nullable()->comment('in minutes');
            $table->integer('actual_duration')->nullable()->comment('in minutes');
            $table->boolean('is_recurring')->default(false);
            $table->enum('recurring_interval', ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('asset_id')->references('id')->on('assets')->onDelete('cascade');
            $table->foreign('requester_id')->references('id')->on('profiles')->onDelete('set null');
            $table->foreign('assigned_technician_id')->references('id')->on('profiles')->onDelete('set null');
            $table->index('status');
            $table->index('priority');
            $table->index('scheduled_date');
            $table->index('assigned_technician_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenance_tickets');
    }
};
