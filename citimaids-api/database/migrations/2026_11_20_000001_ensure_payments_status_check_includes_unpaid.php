<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Re-applies the payments_status_check constraint to guarantee 'unpaid' is allowed.
 * Safe to run multiple times — always drops before re-creating.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check');
            DB::statement("ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN ('pending', 'paid', 'unpaid', 'failed', 'refunded', 'expired'))");
        }
        // MySQL uses ENUM — already handled by 2026_10_31_140000 migration; no action needed.
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check');
            DB::statement("ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'expired'))");
        }
    }
};
