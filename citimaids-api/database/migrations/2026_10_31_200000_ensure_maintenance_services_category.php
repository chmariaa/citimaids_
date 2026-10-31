<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Ensure maintenance services have category 'maintenance'
        DB::table('services')
            ->where(function ($query) {
                $query->where('name', 'LIKE', '%Landscape%')
                      ->orWhere('name', 'LIKE', '%Garden%')
                      ->orWhere('name', 'LIKE', '%Pool%')
                      ->orWhere('name', 'LIKE', '%Maintenance%');
            })
            ->update(['category' => 'maintenance']);

        // 2. Ensure official maintenance services exist with category 'maintenance'
        $maintenanceServices = [
            [
                'name'          => 'Landscape Contractor',
                'category'      => 'maintenance',
                'description'   => 'Turnkey landscaping solutions, irrigation systems, and outdoor living design for villas.',
                'base_price'    => 200.00,
                'icon'          => 'building',
                'status'        => 'active',
                'display_order' => 15,
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
            [
                'name'          => 'Garden Maintenance',
                'category'      => 'maintenance',
                'description'   => 'Lawn care, precision hedging, palm frond pruning, and soil enrichment across Abu Dhabi.',
                'base_price'    => 120.00,
                'icon'          => 'sparkles',
                'status'        => 'active',
                'display_order' => 16,
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
            [
                'name'          => 'Swimming Pool Maintenance',
                'category'      => 'maintenance',
                'description'   => 'Water chemistry testing, backwash, vacuuming, and mechanical inspection for pristine pools.',
                'base_price'    => 150.00,
                'icon'          => 'sparkles',
                'status'        => 'active',
                'display_order' => 17,
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
        ];

        foreach ($maintenanceServices as $svc) {
            $exists = DB::table('services')->where('name', $svc['name'])->exists();
            if ($exists) {
                DB::table('services')->where('name', $svc['name'])->update([
                    'category' => 'maintenance',
                ]);
            } else {
                DB::table('services')->insert($svc);
            }
        }
    }

    public function down(): void
    {
        // Keep category intact
    }
};

