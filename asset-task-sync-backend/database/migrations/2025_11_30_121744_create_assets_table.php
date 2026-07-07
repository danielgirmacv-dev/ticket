<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->enum('type', ['computer', 'printer', 'server', 'network_device', 'other']);
            $table->string('serial_number')->unique();
            $table->date('purchase_date');
            $table->date('warranty_expiry')->nullable();
            $table->string('location');
            $table->enum('status', ['active', 'maintenance', 'retired', 'disposed'])->default('active');
            $table->uuid('assigned_to')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('assigned_to')->references('id')->on('profiles')->onDelete('set null');
            $table->index('status');
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
