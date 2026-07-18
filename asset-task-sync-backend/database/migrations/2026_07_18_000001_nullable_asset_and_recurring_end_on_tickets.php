<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('maintenance_tickets', function (Blueprint $table) {
            $table->dropForeign(['asset_id']);
        });

        // Make asset_id nullable without requiring doctrine/dbal
        DB::statement('ALTER TABLE maintenance_tickets MODIFY asset_id CHAR(36) NULL');

        Schema::table('maintenance_tickets', function (Blueprint $table) {
            $table->foreign('asset_id')->references('id')->on('assets')->onDelete('set null');
            $table->date('recurring_ends_at')->nullable()->after('recurring_interval');
        });
    }

    public function down(): void
    {
        Schema::table('maintenance_tickets', function (Blueprint $table) {
            $table->dropForeign(['asset_id']);
            $table->dropColumn('recurring_ends_at');
        });

        DB::statement('ALTER TABLE maintenance_tickets MODIFY asset_id CHAR(36) NOT NULL');

        Schema::table('maintenance_tickets', function (Blueprint $table) {
            $table->foreign('asset_id')->references('id')->on('assets')->onDelete('cascade');
        });
    }
};
