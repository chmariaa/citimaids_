<?php

namespace Tests\Feature;

use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServicesApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_retrieve_active_services_list(): void
    {
        $initialActiveCount = Service::where('status', 'active')->count();

        // Arrange: Create an active service and an inactive service
        Service::create([
            'name' => 'Deep Cleaning',
            'category' => 'residential',
            'description' => 'Comprehensive deep cleaning service',
            'base_price' => 250.00,
            'status' => 'active',
            'display_order' => 1,
        ]);

        Service::create([
            'name' => 'Archived Service',
            'category' => 'residential',
            'description' => 'Old service',
            'base_price' => 100.00,
            'status' => 'inactive',
            'display_order' => 2,
        ]);

        // Act: Request public services API endpoint
        $response = $this->getJson('/api/services');

        // Assert: Ensure HTTP 200, includes active service, excludes inactive service
        $response->assertStatus(200)
            ->assertJsonCount($initialActiveCount + 1)
            ->assertJsonFragment([
                'name' => 'Deep Cleaning',
                'status' => 'active',
            ])
            ->assertJsonMissing([
                'name' => 'Archived Service',
            ]);
    }
}
