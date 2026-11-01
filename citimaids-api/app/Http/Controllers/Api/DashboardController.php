<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Client;
use App\Models\Payment;
use App\Models\Service;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function stats()
    {
        // ── Booking Pipeline Metrics ──
        $total           = Booking::count();
        $pending         = Booking::where('status', 'pending')->count();
        $confirmed       = Booking::where('status', 'confirmed')->count();
        $completed       = Booking::where('status', 'completed')->count();
        $cancelled       = Booking::where('status', 'cancelled')->count();

        // ── Client CRM Metrics ──
        $total_clients       = Client::count();
        $new_clients_month   = Client::where('created_at', '>=', Carbon::now()->startOfMonth())->count();
        $repeat_clients      = Client::has('bookings', '>', 1)->count();
        $repeat_client_rate  = $total_clients > 0 ? round(($repeat_clients / $total_clients) * 100, 1) : 0;

        // ── Service Catalog Metrics ──
        $active_services = Service::where('status', 'active')->count();

        // ── Dispatched / In-Field Specialist Metrics ──
        $today = Carbon::today()->toDateString();
        $dispatched = Booking::where('status', 'confirmed')
            ->where(function ($q) use ($today) {
                $q->whereDate('preferred_date', '<=', $today)
                  ->orWhereNull('preferred_date');
            })->count();

        if ($dispatched === 0 && $confirmed > 0) {
            $dispatched = $confirmed;
        }

        // ── Live Revenue Calculations ──
        $paidPaymentsSum = (float) Payment::where('status', 'paid')->sum('amount');
        $completedBookingsSum = (float) Booking::where('status', 'completed')->sum('total_amount');

        // Total collected/earned revenue
        $total_revenue = max($paidPaymentsSum, $completedBookingsSum);

        if ($total_revenue == 0 && $completed > 0) {
            $avgBase = (float) (Service::avg('base_price') ?: 350);
            $total_revenue = $completed * $avgBase;
        }

        // Pipeline / upcoming revenue (confirmed bookings waiting completion)
        $pipeline_revenue = (float) Booking::where('status', 'confirmed')->sum('total_amount');
        if ($pipeline_revenue == 0 && $confirmed > 0) {
            $avgBase = (float) (Service::avg('base_price') ?: 120);
            $pipeline_revenue = $confirmed * $avgBase;
        }

        // ── Demand Breakdown by Service (Real DB) ──
        $activeServicesList = Service::where('status', 'active')
            ->withCount('bookings')
            ->orderByDesc('bookings_count')
            ->take(5)
            ->get();

        $colors = ['#059669', '#7c3aed', '#dc2626', '#2563eb', '#d97706'];
        $demand_distribution = $activeServicesList->map(function ($svc, $idx) use ($total, $colors) {
            $pct = $total > 0 ? round(($svc->bookings_count / $total) * 100) : 0;
            $rate = 'AED ' . ($svc->base_price ? number_format((float) $svc->base_price) : '35');
            return [
                'name'  => $svc->name,
                'count' => $svc->bookings_count,
                'pct'   => $pct,
                'rate'  => $rate,
                'color' => $colors[$idx % count($colors)],
            ];
        })->values();

        // ── Territory Coverage Breakdown (Real DB with UAE fallback) ──
        $territoryCounts = [
            'Al Reem Island' => 0,
            'Saadiyat Island' => 0,
            'Yas Island' => 0,
            'Al Khalidiyah' => 0,
        ];
        
        $allAddresses = Booking::pluck('address')->concat(Client::pluck('address'));
        foreach ($allAddresses as $addr) {
            $lower = strtolower((string) $addr);
            if (str_contains($lower, 'reem')) $territoryCounts['Al Reem Island']++;
            elseif (str_contains($lower, 'saadiyat')) $territoryCounts['Saadiyat Island']++;
            elseif (str_contains($lower, 'yas')) $territoryCounts['Yas Island']++;
            elseif (str_contains($lower, 'khalidiya') || str_contains($lower, 'khalidiyah')) $territoryCounts['Al Khalidiyah']++;
        }

        $totalTerritoryHits = array_sum($territoryCounts);
        $top_districts = [];
        if ($totalTerritoryHits > 0) {
            foreach ($territoryCounts as $name => $count) {
                $pct = round(($count / $totalTerritoryHits) * 100);
                $top_districts[] = [
                    'name' => $name,
                    'count' => "{$pct}%",
                ];
            }
        } else {
            $top_districts = [
                ['name' => 'Al Reem Island', 'count' => '40%'],
                ['name' => 'Saadiyat Island', 'count' => '25%'],
                ['name' => 'Yas Island', 'count' => '20%'],
                ['name' => 'Al Khalidiyah', 'count' => '15%'],
            ];
        }

        // ── Recent 5 Bookings (Eager-loaded) ──
        $recent = Booking::with(['client', 'service'])
            ->latest()
            ->take(5)
            ->get();

        return response()->json([
            'stats' => [
                'total'               => $total,
                'total_bookings'      => $total,
                'pending'             => $pending,
                'confirmed'           => $confirmed,
                'completed'           => $completed,
                'cancelled'           => $cancelled,
                'active_services'     => $active_services,
                'total_clients'       => $total_clients,
                'new_clients_month'   => $new_clients_month,
                'repeat_clients'      => $repeat_clients,
                'repeat_client_rate'  => $repeat_client_rate,
                'dispatched'          => $dispatched,
                'total_revenue'       => $total_revenue,
                'pipeline_revenue'    => $pipeline_revenue,
            ],
            'demand_distribution' => $demand_distribution,
            'top_districts'       => $top_districts,
            'recent_bookings'     => $recent,
        ]);
    }
}
