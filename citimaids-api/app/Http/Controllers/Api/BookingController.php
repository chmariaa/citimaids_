<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Client;
use App\Models\Service;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    // Public: list all bookings (admin) or with filters
    public function index(Request $request)
    {
        $query = Booking::with(['client', 'service', 'processedBy']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('client', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return response()->json($query->latest()->paginate(15));
    }

    // Public & Admin: submit/create a booking
    public function store(Request $request)
    {
        $user = auth('sanctum')->user() ?? $request->user();
        $isAdmin = (bool) $user;

        $validated = $request->validate([
            'client_id'      => 'nullable|exists:clients,id',
            'name'           => 'required_without:client_id|nullable|string|max:255',
            'contact_number' => 'required_without:client_id|nullable|string|max:50',
            'email'          => 'nullable|email|max:255',
            'service_id'     => 'required|exists:services,id',
            'preferred_date' => $isAdmin ? 'required|date' : 'required|date|after_or_equal:today',
            'address'        => 'nullable|string',
            'notes'          => 'nullable|string',
            'status'         => 'nullable|in:pending,confirmed,completed,cancelled',
            'total_amount'   => 'nullable|numeric|min:0',
            'payment_status' => 'nullable|in:unpaid,partial,paid,refunded',
            'payment_method' => 'nullable|string|max:100',
        ]);

        // For public customer bookings, ensure the selected service is currently active
        if (! $isAdmin) {
            $service = Service::where('id', $validated['service_id'])
                ->where('status', 'active')
                ->first();

            if (! $service) {
                return response()->json([
                    'message' => 'The selected service is currently unavailable for booking.',
                    'errors'  => ['service_id' => ['The selected service is currently inactive.']],
                ], 422);
            }
        } else {
            $service = Service::find($validated['service_id']);
        }

        // Find existing client or create new client record
        if ($request->filled('client_id')) {
            $client = Client::findOrFail($validated['client_id']);
        } else {
            $client = Client::firstOrCreate(
                ['contact_number' => $validated['contact_number']],
                [
                    'name'    => $validated['name'],
                    'email'   => $validated['email'] ?? null,
                    'address' => $validated['address'] ?? null,
                ]
            );
        }

        $address = !empty($validated['address']) ? $validated['address'] : ($client->address ?? '');

        // Resolve base price if total_amount is omitted
        $totalAmount = $request->filled('total_amount')
            ? (float) $validated['total_amount']
            : ($service?->base_price ? (float) $service->base_price : null);

        $booking = Booking::create([
            'client_id'            => $client->id,
            'service_id'           => $validated['service_id'],
            'processed_by_user_id' => $user?->id,
            'preferred_date'       => $validated['preferred_date'],
            'address'              => $address,
            'notes'                => $validated['notes'] ?? null,
            'status'               => $validated['status'] ?? 'pending',
            'total_amount'         => $totalAmount,
            'payment_status'       => $validated['payment_status'] ?? 'unpaid',
            'payment_method'       => $validated['payment_method'] ?? 'Cash on Completion',
        ]);

        return response()->json([
            'message'    => 'Booking created successfully.',
            'booking_id' => $booking->id,
            'reference'  => 'CM-' . str_pad($booking->id, 5, '0', STR_PAD_LEFT),
            'booking'    => $booking->load(['client', 'service', 'processedBy']),
        ], 201);
    }

    /**
     * Public Booking Tracking Endpoint
     *
     * Allows customers to check the real-time status of their booking without requiring authentication.
     * Searches by either:
     *   - 'ref' or 'reference' (e.g. "CM-00001", "CM1", or numeric ID 1)
     *   - 'phone' or 'contact_number' (matched against client records)
     *
     * Features:
     *   - Generates an active 4-step dispatch timeline (Inquiry -> Confirmed -> En Route -> Completed).
     *   - Masks client names (e.g., "Sarah A.") for privacy on public queries.
     *   - Returns sanitized service, scheduling, payment status, and location details.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function track(Request $request)
    {
        $query = Booking::with(['service', 'client', 'details.service']);

        $ref = $request->query('ref') ?? $request->query('reference');
        $phone = $request->query('phone') ?? $request->query('contact_number');

        if (!$ref && !$phone) {
            return response()->json([
                'message' => 'Please provide a booking reference number or contact number.'
            ], 422);
        }

        if ($ref) {
            $cleanRef = preg_replace('/[^0-9]/', '', $ref);
            if (empty($cleanRef)) {
                return response()->json(['message' => 'Invalid reference number format.'], 404);
            }
            $query->where('id', (int) $cleanRef);
        } elseif ($phone) {
            $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
            $query->whereHas('client', function ($q) use ($cleanPhone, $phone) {
                $q->where('contact_number', 'like', "%{$cleanPhone}%")
                  ->orWhere('contact_number', 'like', "%{$phone}%");
            });
        }

        $booking = $query->latest()->first();

        if (!$booking) {
            return response()->json([
                'message' => 'No booking found matching your details. Please verify your reference number or contact our dispatch team.'
            ], 404);
        }

        $steps = [
            [
                'key' => 'pending',
                'title' => 'Inquiry Received',
                'description' => 'Your booking request is logged and awaiting dispatch scheduling.',
            ],
            [
                'key' => 'confirmed',
                'title' => 'Confirmed & Scheduled',
                'description' => 'Slot confirmed. Cleaning team and supplies allocated for your slot.',
            ],
            [
                'key' => 'en_route',
                'title' => 'Crew En Route',
                'description' => 'Your cleaning specialists are on their way to your location.',
            ],
            [
                'key' => 'completed',
                'title' => 'Service Completed',
                'description' => 'Cleaning completed with inspection checklist verified.',
            ],
        ];

        $statusIndex = match ($booking->status) {
            'pending' => 0,
            'confirmed' => 1,
            'completed' => 3,
            'cancelled' => -1,
            default => 0,
        };

        $timeline = array_map(function ($step, $index) use ($statusIndex, $booking) {
            $isCancelled = $booking->status === 'cancelled';
            return [
                'key' => $step['key'],
                'title' => $step['title'],
                'description' => $step['description'],
                'done' => !$isCancelled && $index <= $statusIndex,
                'current' => !$isCancelled && $index === $statusIndex,
            ];
        }, $steps, array_keys($steps));

        $clientName = $booking->client?->name ?? 'Valued Client';
        $parts = explode(' ', trim($clientName));
        $maskedName = count($parts) > 1 
            ? $parts[0] . ' ' . strtoupper(substr(end($parts), 0, 1)) . '.' 
            : $parts[0];

        return response()->json([
            'booking_id'      => $booking->id,
            'reference'       => 'CM-' . str_pad($booking->id, 5, '0', STR_PAD_LEFT),
            'status'          => $booking->status,
            'is_cancelled'    => $booking->status === 'cancelled',
            'client_name'     => $maskedName,
            'contact_number'  => $booking->client?->contact_number,
            'preferred_date'  => $booking->preferred_date,
            'address'         => $booking->address,
            'notes'           => $booking->notes,
            'total_amount'    => $booking->total_amount,
            'payment_status'  => $booking->payment_status ?? 'unpaid',
            'payment_method'  => $booking->payment_method ?? 'Cash on Completion',
            'service'         => [
                'id'          => $booking->service?->id,
                'name'        => $booking->service?->name,
                'rate'        => $booking->service?->rate,
                'rate_type'   => $booking->service?->rate_type,
            ],
            'timeline'        => $timeline,
            'created_at'      => $booking->created_at?->format('M d, Y h:i A'),
            'updated_at'      => $booking->updated_at?->format('M d, Y h:i A'),
        ]);
    }

    public function show($id)
    {
        $booking = Booking::with(['client', 'service', 'processedBy', 'details.service'])->findOrFail($id);
        return response()->json($booking);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,confirmed,completed,cancelled',
        ]);

        $booking = Booking::findOrFail($id);
        $booking->update([
            'status'               => $request->status,
            'processed_by_user_id' => $request->user()->id,
        ]);

        return response()->json(['message' => 'Status updated.', 'booking' => $booking->load(['client', 'service'])]);
    }

    public function destroy($id)
    {
        Booking::findOrFail($id)->delete();
        return response()->json(['message' => 'Booking deleted.']);
    }
}
