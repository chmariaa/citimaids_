<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inquiry;
use Illuminate\Http\Request;

class InquiryController extends Controller
{
    /**
     * Public: submit a new customer inquiry from Contact page.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'    => 'required|string|max:120',
            'email'   => 'required|email|max:120',
            'phone'   => 'nullable|string|max:50',
            'message' => 'required|string|min:5|max:3000',
        ]);

        $validated['status'] = 'pending';

        $inquiry = Inquiry::create($validated);

        return response()->json([
            'message' => 'Thank you for reaching out. Our dispatch team will follow up with you within 2 hours.',
            'inquiry' => $inquiry,
        ], 201);
    }

    /**
     * Admin: list all customer inquiries with optional status filtering.
     */
    public function adminIndex(Request $request)
    {
        $query = Inquiry::orderByDesc('created_at');

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        return response()->json($query->get());
    }

    /**
     * Admin: view single inquiry.
     */
    public function show($id)
    {
        $inquiry = Inquiry::findOrFail($id);
        return response()->json($inquiry);
    }

    /**
     * Admin: quick update status.
     */
    public function updateStatus(Request $request, $id)
    {
        $inquiry = Inquiry::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:pending,replied,closed',
        ]);

        $inquiry->status = $validated['status'];
        if ($validated['status'] === 'replied' && !$inquiry->replied_at) {
            $inquiry->replied_at = now();
        } elseif ($validated['status'] === 'pending') {
            $inquiry->replied_at = null;
        }

        $inquiry->save();

        return response()->json($inquiry);
    }

    /**
     * Admin: update status and internal administrative notes.
     */
    public function update(Request $request, $id)
    {
        $inquiry = Inquiry::findOrFail($id);

        $validated = $request->validate([
            'status'      => 'sometimes|in:pending,replied,closed',
            'admin_notes' => 'nullable|string|max:2000',
        ]);

        if (isset($validated['status'])) {
            $inquiry->status = $validated['status'];
            if ($validated['status'] === 'replied' && !$inquiry->replied_at) {
                $inquiry->replied_at = now();
            } elseif ($validated['status'] === 'pending') {
                $inquiry->replied_at = null;
            }
        }

        if (array_key_exists('admin_notes', $validated)) {
            $inquiry->admin_notes = $validated['admin_notes'];
        }

        $inquiry->save();

        return response()->json($inquiry);
    }

    /**
     * Admin: delete inquiry.
     */
    public function destroy($id)
    {
        $inquiry = Inquiry::findOrFail($id);
        $inquiry->delete();

        return response()->json(['message' => 'Inquiry deleted successfully.']);
    }
}

