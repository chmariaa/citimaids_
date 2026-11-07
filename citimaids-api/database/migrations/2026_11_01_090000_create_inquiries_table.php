<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inquiries', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->text('message');
            $table->enum('status', ['pending', 'replied', 'closed'])->default('pending');
            $table->text('admin_notes')->nullable();
            $table->timestamp('replied_at')->nullable();
            $table->timestamps();
        });

        // Insert initial sample inquiries if empty
        DB::table('inquiries')->insert([
            [
                'name' => 'Fatima Al Zaabi',
                'email' => 'fatima.zaabi@example.ae',
                'phone' => '+971 50 123 4567',
                'message' => 'Hello CitiMaids team, I need a deep cleaning service for a 4-bedroom villa on Saadiyat Island this Thursday morning. Do your staff bring eco-friendly cleaning detergents and specialized steam machinery?',
                'status' => 'pending',
                'admin_notes' => null,
                'replied_at' => null,
                'created_at' => now()->subHours(3),
                'updated_at' => now()->subHours(3),
            ],
            [
                'name' => 'David Mitchell',
                'email' => 'david.mitchell@consultancy.ae',
                'phone' => '+971 52 987 6543',
                'message' => 'Hi, we are seeking recurring commercial office cleaning for our boutique finance firm located in ADGM, Al Maryah Island. We require evening service 3 days per week. Kindly share your corporate package proposal.',
                'status' => 'replied',
                'admin_notes' => 'Contacted via WhatsApp & emailed corporate commercial proposal sheet.',
                'replied_at' => now()->subHours(5),
                'created_at' => now()->subDay(),
                'updated_at' => now()->subHours(5),
            ],
            [
                'name' => 'Noura Al Qasimi',
                'email' => 'noura.qasimi@gmail.com',
                'phone' => '+971 56 345 6789',
                'message' => 'Good day! Is it possible to book 2 maids for 4 hours of residential cleaning in Al Reem Island tomorrow at 2:00 PM? Please confirm availability.',
                'status' => 'pending',
                'admin_notes' => null,
                'replied_at' => null,
                'created_at' => now()->subMinutes(45),
                'updated_at' => now()->subMinutes(45),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('inquiries');
    }
};
