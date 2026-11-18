<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    // ── Public: fetch approved reviews ──────────────────────────────────────────
    public function index()
    {
        $reviews = Review::approved()
            ->orderByDesc('created_at')
            ->get(['id', 'name', 'location', 'stars', 'body', 'created_at']);

        return response()->json($reviews);
    }

    // ── Public: submit a new review (starts as pending) ─────────────────────────
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:120',
            'whatsapp' => 'nullable|string|max:30',
            'location' => 'nullable|string|max:120',
            'stars' => 'required|integer|min:1|max:5',
            'body' => 'required|string|min:10|max:1500',
        ]);

        $review = Review::create($validated);

        return response()->json([
            'message' => 'Thank you! Your review will appear once approved.',
            'review' => $review,
        ], 201);
    }

    // ── Admin: list ALL reviews with optional status filter ─────────────────────
    public function adminIndex(Request $request)
    {
        $query = Review::orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->get());
    }

    // ── Admin: create a new review directly (can be approved immediately) ────────
    public function adminStore(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:120',
            'whatsapp' => 'nullable|string|max:30',
            'location' => 'nullable|string|max:120',
            'stars' => 'required|integer|min:1|max:5',
            'body' => 'required|string|min:5|max:1500',
            'status' => 'nullable|in:pending,approved,rejected',
        ]);

        if (empty($validated['status'])) {
            $validated['status'] = 'approved';
        }

        $review = Review::create($validated);

        return response()->json([
            'message' => 'Review created successfully.',
            'review' => $review,
        ], 201);
    }

    // ── Admin: update review details & status ────────────────────────────────────
    public function update(Request $request, $id)
    {
        $review = Review::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:120',
            'whatsapp' => 'nullable|string|max:30',
            'location' => 'nullable|string|max:120',
            'stars' => 'sometimes|required|integer|min:1|max:5',
            'body' => 'sometimes|required|string|min:5|max:1500',
            'status' => 'sometimes|required|in:pending,approved,rejected',
        ]);

        $review->update($validated);

        return response()->json($review);
    }

    // ── Admin: delete a review ───────────────────────────────────────────────────
    public function destroy($id)
    {
        Review::findOrFail($id)->delete();

        return response()->json(['message' => 'Review deleted.']);
    }

    // ── Admin: quick status patch ─────────────────────────────────────────────────
    public function updateStatus(Request $request, $id)
    {
        $review = Review::findOrFail($id);

        $request->validate([
            'status' => 'required|in:pending,approved,rejected',
        ]);

        $review->update(['status' => $request->status]);

        return response()->json($review);
    }
}
