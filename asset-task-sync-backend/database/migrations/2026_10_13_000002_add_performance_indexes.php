<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Composite indexes for the hot query paths:
     *  - notification bell polling: user + unread + newest
     *  - requester pending-count check: user + status
     *  - manager dashboard list: manager + status
     *
     * Each add is idempotent (skipped if the index already exists) so a
     * partially failed run can be retried safely on live tables.
     */
    public function up(): void
    {
        $this->addIndexIfMissing('notifications', 'notifications_user_read_created_idx', ['user_id', 'is_read', 'created_at']);
        $this->addIndexIfMissing('maintenance_tickets', 'tickets_requester_status_idx', ['requester_id', 'status']);
        $this->addIndexIfMissing('maintenance_tickets', 'tickets_manager_status_idx', ['assigned_manager_id', 'status']);
    }

    public function down(): void
    {
        // Note: composite indexes whose leftmost column backs a foreign key
        // (e.g. requester_id) cannot be dropped in MySQL — error 1553.
        // Drop what's droppable and ignore the rest.
        $this->dropIndexIfPossible('notifications', 'notifications_user_read_created_idx');
        $this->dropIndexIfPossible('maintenance_tickets', 'tickets_manager_status_idx');
        $this->dropIndexIfPossible('maintenance_tickets', 'tickets_requester_status_idx');
    }

    /**
     * Drop an index, ignoring "needed in a foreign key constraint" (1553)
     * and "check that column/key exists" (1091) errors.
     */
    private function dropIndexIfPossible(string $table, string $indexName): void
    {
        if (! Schema::hasIndex($table, $indexName)) {
            return;
        }

        try {
            Schema::table($table, function (Blueprint $blueprint) use ($indexName) {
                $blueprint->dropIndex($indexName);
            });
        } catch (\Illuminate\Database\QueryException $e) {
            if (! $this->isMysqlError($e, [1553, 1091])) {
                throw $e;
            }
        }
    }

    /**
     * Add an index only when it does not already exist (MySQL error 1061 safe).
     */
    private function addIndexIfMissing(string $table, string $indexName, array $columns): void
    {
        if (Schema::hasIndex($table, $indexName)) {
            return;
        }

        try {
            Schema::table($table, function (Blueprint $blueprint) use ($columns, $indexName) {
                $blueprint->index($columns, $indexName);
            });
        } catch (\Illuminate\Database\QueryException $e) {
            if (! $this->isMysqlError($e, [1061])) {
                throw $e;
            }
        }
    }

    /**
     * Match a MySQL driver error number. PDO/Laravel surfaces the SQLSTATE
     * string or driver errno in getCode(), and the errno in errorInfo[1],
     * so compare both against the tolerated MySQL errnos.
     */
    private function isMysqlError(\Illuminate\Database\QueryException $e, array $mysqlErrnos): bool
    {
        $codes = [$e->getCode(), $e->errorInfo[1] ?? null];
        $intersect = array_intersect(array_filter($codes, 'is_int'), $mysqlErrnos);

        return $intersect !== [];
    }
};
