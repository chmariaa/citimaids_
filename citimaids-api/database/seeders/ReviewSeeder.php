<?php

namespace Database\Seeders;

use App\Models\Review;
use Illuminate\Database\Seeder;

class ReviewSeeder extends Seeder
{
    public function run(): void
    {
        $reviews = [
            [
                'name' => 'Fatima Al Mansoori',
                'location' => 'Al Khalidiyah, Abu Dhabi',
                'whatsapp' => '+971501234567',
                'stars' => 5,
                'body' => 'CitiMaids completely elevated our 4-bedroom villa. The cleaners were punctual, polite, and paid incredible attention to marble polishing and kitchen degreasing. By far the best in Abu Dhabi.',
                'status' => 'approved',
            ],
            [
                'name' => 'James Thornton',
                'location' => 'Corniche Towers, Abu Dhabi',
                'whatsapp' => '+971502345678',
                'stars' => 5,
                'body' => 'Outstanding commercial service for our regional office. They operate quietly and thoroughly after hours, and our team arrives every morning to a fresh, gleaming workspace.',
                'status' => 'approved',
            ],
            [
                'name' => 'Sara Al Hashmi',
                'location' => 'Al Mushrif, Abu Dhabi',
                'whatsapp' => '+971503456789',
                'stars' => 5,
                'body' => 'Booked their move-out handover clean. We received our full tenancy security deposit back with zero deductions! The ovens and bathrooms looked brand new.',
                'status' => 'approved',
            ],
            [
                'name' => 'Mohammed Al Zaabi',
                'location' => 'Saadiyat Island, Abu Dhabi',
                'whatsapp' => '+971504567890',
                'stars' => 5,
                'body' => 'Their luxury villa team is truly next-level. Hospital-grade eco detergents mean zero chemical odors, which is essential with our toddlers and golden retriever.',
                'status' => 'approved',
            ],
            [
                'name' => 'Elena Rostova',
                'location' => 'Al Reem Island, Abu Dhabi',
                'whatsapp' => '+971505678901',
                'stars' => 5,
                'body' => 'Consistent 5-star standard every single week. Same vetted cleaner arrives on schedule, Emirates ID verified, completely dependable and meticulous.',
                'status' => 'approved',
            ],
            [
                'name' => 'Tariq Al Ameri',
                'location' => 'Yas Island, Abu Dhabi',
                'whatsapp' => '+971506789012',
                'stars' => 5,
                'body' => 'The online booking takes literally under a minute, and the cleaning team arrived equipped with industrial-grade steam equipment. Worth every single dirham.',
                'status' => 'approved',
            ],
        ];

        foreach ($reviews as $data) {
            Review::firstOrCreate(
                [
                    'name' => $data['name'],
                    'body' => $data['body'],
                ],
                $data
            );
        }
    }
}
