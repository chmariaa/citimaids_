<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::pluck('value', 'key');

        $completedBookings = \App\Models\Booking::where('status', 'completed')->count();
        $base = isset($settings['homes_cleaned_base']) ? (int) $settings['homes_cleaned_base'] : 500;
        $settings['completed_cleanings_count'] = (string) ($base + $completedBookings);

        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            '*' => 'nullable|string', // Validate all incoming fields as string/nullable
        ]);

        foreach ($data as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        return response()->json(['message' => 'Settings saved.']);
    }
}
