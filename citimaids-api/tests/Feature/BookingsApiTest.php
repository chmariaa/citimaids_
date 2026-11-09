<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Client;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BookingsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_search_bookings_by_formatted_id_and_details(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $client = Client::create([
            'name' => 'Sarah Ahmed',
            'contact_number' => '0501234567',
            'email' => 'sarah@example.com',
            'address' => 'Abu Dhabi Corniche',
        ]);

        $service = Service::create([
            'name' => 'Carpet Cleaning',
            'category' => 'residential',
            'description' => 'Deep carpet shampoo and steam clean',
            'base_price' => 300.00,
            'status' => 'active',
            'display_order' => 1,
        ]);

        $booking = Booking::create([
            'client_id' => $client->id,
            'service_id' => $service->id,
            'preferred_date' => '2026-09-04',
            'preferred_time' => 'Morning (08:00 - 12:00)',
            'address' => 'Villa 14, Al Khalidiya',
            'status' => 'confirmed',
            'total_amount' => 300.00,
            'payment_status' => 'unpaid',
            'payment_method' => 'Cash on Completion',
        ]);

        // Search by formatted ID: '#00' . id or '#0014'
        $formattedId = '#'.str_pad((string) $booking->id, 4, '0', STR_PAD_LEFT);
        $response = $this->getJson("/api/bookings?search={$formattedId}");
        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($booking->id, $data[0]['id']);

        // Search by service name
        $serviceResponse = $this->getJson('/api/bookings?search=Carpet');
        $serviceResponse->assertStatus(200);
        $serviceData = $serviceResponse->json('data');
        $this->assertCount(1, $serviceData);
        $this->assertEquals($booking->id, $serviceData[0]['id']);

        // Search by client phone
        $phoneResponse = $this->getJson('/api/bookings?search=0501234567');
        $phoneResponse->assertStatus(200);
        $phoneData = $phoneResponse->json('data');
        $this->assertCount(1, $phoneData);
        $this->assertEquals($booking->id, $phoneData[0]['id']);
    }
}
