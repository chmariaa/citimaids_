<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            'business_name' => 'CitiMaids Cleaning Services',
            'contact_number' => '+971 52 634 9461',
            'additional_number' => '+971 58 175 3958',
            'business_email' => 'info@citi-maids.com',
            'additional_email' => 'citimaidsuae@gmail.com',
            'business_address' => 'Aljazeera Tower, Room 45, Hamdan St, Abu Dhabi, UAE',
            'facebook_url' => 'https://web.facebook.com/people/CitiMaids-Cleaning-Services/61550129471847/',
            'tiktok_url' => 'https://www.tiktok.com/@citimaids?_t=8pO7VCQjaUy&_r=1',
            'description' => 'Luxury residential, commercial, and maintenance services tailored across Abu Dhabi.',
            'operating_hours_weekdays' => 'Monday – Saturday: 7:00 AM – 9:00 PM',
            'operating_hours_sunday' => 'Sunday: 8:00 AM – 6:00 PM',
            'response_time' => 'under 15 minutes',
            'homes_cleaned_base' => '500',
            'booking_time_slots' => '8:00 AM, 10:00 AM, 12:00 PM, 2:00 PM, 4:00 PM, 6:00 PM',
            'active_cities' => 'Abu Dhabi, Dubai, Sharjah',
            'timezone' => 'Asia/Dubai',
            'currency' => 'AED',
        ];

        foreach ($settings as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}
