<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Transaction;
use App\Services\AdcbPacePayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    /**
     * List all payments (admin, with filters).
     */
    public function index(Request $request): JsonResponse
    {
        $sortDir = strtolower($request->get('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $query = Payment::with(['booking.service', 'booking.processedBy', 'booking.details.service', 'client', 'transactions'])
            ->orderBy('created_at', $sortDir);

        // ── Filters ──
        if ($request->filled('service_id') && $request->service_id !== 'all') {
            $query->whereHas('booking', fn($bq) => $bq->where('service_id', $request->service_id));
        }
        if ($request->filled('status')) {
            $status = $request->status;
            if ($status === 'unpaid' || $status === 'failed') {
                $query->whereIn('status', ['unpaid', 'failed']);
            } else {
                $query->where('status', $status);
            }
        }
        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }
        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }
        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }
        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where('reference_number', 'like', "%{$s}%")
                  ->orWhere('external_reference', 'like', "%{$s}%")
                  ->orWhere('amount', 'like', "%{$s}%")
                  ->orWhere('status', 'like', "%{$s}%")
                  ->orWhere('payment_method', 'like', "%{$s}%")
                  ->orWhereHas('client', fn($cq) => $cq->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%")->orWhere('contact_number', 'like', "%{$s}%"))
                  ->orWhereHas('booking', fn($bq) => $bq->where('id', 'like', "%{$s}%"))
                  ->orWhereHas('booking.service', fn($sq) => $sq->where('name', 'like', "%{$s}%"));
            });
        }

        $payments = $query->paginate($request->get('per_page', 15));

        return response()->json($payments);
    }

    /**
     * Show a single payment with transactions.
     */
    public function show(int $id): JsonResponse
    {
        $payment = Payment::with(['booking.service', 'booking.client', 'client', 'transactions.processedBy'])
            ->findOrFail($id);

        return response()->json($payment);
    }

    /**
     * Create a payment for a booking and generate ADCB Pace Pay link.
     */
    public function createForBooking(Request $request, int $bookingId): JsonResponse
    {
        $booking = Booking::with('client')->findOrFail($bookingId);

        // Validate
        $request->validate([
            'amount'         => 'required|numeric|min:1',
            'payment_method' => 'required|in:adcb_pace_pay,bank_transfer,cash,card',
            'notes'          => 'nullable|string|max:1000',
        ]);

        // Create payment record
        $payment = Payment::create([
            'booking_id'       => $booking->id,
            'client_id'        => $booking->client_id,
            'amount'           => $request->amount,
            'currency'         => 'AED',
            'payment_method'   => $request->payment_method,
            'status'           => 'pending',
            'reference_number' => Payment::generateReference(),
            'notes'            => $request->notes,
        ]);

        // If ADCB Pace Pay, generate the payment link
        if ($request->payment_method === 'adcb_pace_pay') {
            $adcb   = new AdcbPacePayService();
            $result = $adcb->generatePaymentLink($payment);

            $payment->update([
                'payment_link'            => $result['link'],
                'payment_link_expires_at' => $result['expires_at'],
                'external_reference'      => $result['external_reference'],
            ]);
        }

        // Create initial charge transaction
        Transaction::create([
            'payment_id'           => $payment->id,
            'type'                 => 'charge',
            'amount'               => $payment->amount,
            'status'               => 'pending',
            'description'          => "Payment created for Booking #{$booking->id}",
            'processed_by_user_id' => $request->user()?->id,
        ]);

        // Update booking payment info
        $booking->update([
            'total_amount'   => $request->amount,
            'payment_status' => 'unpaid',
            'payment_method' => $request->payment_method,
        ]);

        $payment->load(['transactions', 'client', 'booking']);

        return response()->json([
            'message' => 'Payment created successfully',
            'payment' => $payment,
        ], 201);
    }

    /**
     * Update payment status (mark as paid, failed, expired).
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $payment = Payment::with(['booking', 'transactions'])->findOrFail($id);

        $request->validate([
            'status' => 'required|in:pending,paid,unpaid,failed,refunded,expired',
        ]);

        $oldStatus = $payment->status;
        $newStatus = $request->status;
        $rawMethod = $payment->payment_method ?? 'card';
        $normalizedMethod = $this->normalizePaymentMethodCode($rawMethod);
        $methodLabel = $this->formatPaymentMethodLabel($rawMethod);

        $payment->update([
            'status'  => $newStatus,
            'paid_at' => $newStatus === 'paid' ? now() : $payment->paid_at,
        ]);

        // Sync booking payment_status
        if ($newStatus === 'paid') {
            $payment->booking?->update(['payment_status' => 'paid']);
        } elseif ($newStatus === 'refunded') {
            $payment->booking?->update(['payment_status' => 'refunded']);
        } else {
            $payment->booking?->update(['payment_status' => 'unpaid']);
        }

        // Update existing linked transaction directly in place (no duplicate records)
        $this->syncLinkedTransactionInPlace($payment, $newStatus, $methodLabel, $normalizedMethod, null, $request->user()?->id);

        return response()->json([
            'message' => "Payment status updated from {$oldStatus} to {$newStatus}",
            'payment' => $payment->fresh(['transactions.processedBy', 'booking']),
        ]);
    }

    /**
     * Process a refund for a payment.
     */
    public function refund(Request $request, int $id): JsonResponse
    {
        $payment = Payment::findOrFail($id);

        if ($payment->status !== 'paid') {
            return response()->json([
                'message' => 'Only paid payments can be refunded',
            ], 422);
        }

        $request->validate([
            'amount' => 'nullable|numeric|min:0.01|max:' . $payment->amount,
            'reason' => 'nullable|string|max:500',
        ]);

        $refundAmount = $request->get('amount', $payment->amount);

        // If ADCB Pace Pay, process through the gateway
        $gatewayResponse = null;
        if ($payment->payment_method === 'adcb_pace_pay') {
            $adcb   = new AdcbPacePayService();
            $result = $adcb->processRefund($payment, $refundAmount);
            $gatewayResponse = $result['raw'];

            if (!$result['success']) {
                return response()->json([
                    'message' => 'Gateway refund failed',
                    'details' => $result['raw'],
                ], 502);
            }
        }

        // Create refund transaction
        Transaction::create([
            'payment_id'           => $payment->id,
            'type'                 => 'refund',
            'amount'               => $refundAmount,
            'status'               => 'success',
            'gateway_response'     => $gatewayResponse,
            'description'          => $request->get('reason', 'Refund processed'),
            'processed_by_user_id' => $request->user()?->id,
        ]);

        // Update payment status
        $payment->update(['status' => 'refunded']);
        $payment->booking()->update(['payment_status' => 'refunded']);

        return response()->json([
            'message' => "AED {$refundAmount} refunded successfully",
            'payment' => $payment->fresh(['transactions', 'booking']),
        ]);
    }

    /**
     * Delete / Dismiss a payment (especially failed or cancelled).
     */
    public function destroy(int $id): JsonResponse
    {
        $payment = Payment::findOrFail($id);
        $ref = $payment->reference_number;
        $payment->delete();

        return response()->json([
            'message' => "Payment invoice {$ref} dismissed and removed successfully",
        ]);
    }

    /**
     * Update payment details (status, payment_method, notes, etc.).
     * Updates the existing linked record in the Transactions Ledger directly in place.
     * Does not create new or duplicate transaction log entries.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $payment = Payment::with(['booking', 'transactions'])->findOrFail($id);

        $request->validate([
            'status'             => 'nullable|string|in:pending,paid,unpaid,failed,refunded,expired',
            'amount'             => 'nullable|numeric|min:0',
            'payment_method'     => 'nullable|string|max:50',
            'reference_number'   => 'nullable|string|max:100',
            'external_reference' => 'nullable|string|max:100',
            'notes'              => 'nullable|string|max:2000',
            'description'        => 'nullable|string|max:1000',
        ]);

        $updateData = $request->only(['amount', 'reference_number', 'external_reference', 'notes']);

        $rawMethod = $request->payment_method ?? $payment->payment_method ?? 'card';
        $normalizedMethod = $this->normalizePaymentMethodCode($rawMethod);
        $methodLabel = $this->formatPaymentMethodLabel($rawMethod);

        if ($request->filled('payment_method')) {
            $updateData['payment_method'] = $normalizedMethod;
        }

        $newStatus = $request->input('status', $payment->status);

        if ($request->filled('status')) {
            $updateData['status'] = $newStatus;

            if ($newStatus === 'paid') {
                $updateData['paid_at'] = now();
                $payment->booking?->update([
                    'payment_status' => 'paid',
                    'payment_method' => $normalizedMethod,
                ]);
            } elseif ($newStatus === 'refunded') {
                $payment->booking?->update([
                    'payment_status' => 'refunded',
                ]);
            } elseif (in_array($newStatus, ['unpaid', 'failed', 'pending'])) {
                $payment->booking?->update([
                    'payment_status' => 'unpaid',
                    'payment_method' => $normalizedMethod,
                ]);
            }
        }

        $payment->update($updateData);
        $payment->refresh();

        // Directly update the existing linked transaction record in place (no duplicate entries)
        $this->syncLinkedTransactionInPlace(
            $payment,
            $newStatus,
            $methodLabel,
            $normalizedMethod,
            $request->notes,
            $request->user()?->id,
            $request->description
        );

        return response()->json([
            'message' => 'Invoice details and linked transaction updated in place successfully',
            'payment' => $payment->fresh(['booking.service', 'booking.processedBy', 'booking.details.service', 'client', 'transactions.processedBy']),
        ]);
    }

    /**
     * Updates the existing linked record in the Transactions Ledger directly in place.
     * Does not create new or duplicate transaction log entries.
     *
     * Status Mapping Rules:
     * - Invoice set to Paid     ➔ Linked Transaction status updates to Success
     * - Invoice set to Unpaid   ➔ Linked Transaction status updates to Failed
     * - Invoice set to Pending  ➔ Linked Transaction status updates to Pending
     * - Invoice set to Refunded ➔ Linked Transaction status updates to Success
     */
    protected function syncLinkedTransactionInPlace(
        Payment $payment,
        string $status,
        string $methodLabel,
        string $methodCode,
        ?string $notes = null,
        ?int $userId = null,
        ?string $customDescription = null
    ): Transaction {
        $amount = (float) $payment->amount;
        $ref = $payment->reference_number ?: ("INV-" . $payment->id);

        // Status mapping rules:
        $txStatus = match ($status) {
            'paid'     => 'success',
            'unpaid'   => 'failed',
            'pending'  => 'pending',
            'refunded' => 'success',
            default    => ($status === 'failed' ? 'failed' : 'pending'),
        };

        $txType = ($status === 'refunded') ? 'refund' : 'charge';

        $description = $customDescription;
        if (empty($description)) {
            if ($status === 'paid') {
                $description = "Payment received via {$methodLabel} for Invoice #{$ref}";
            } elseif ($status === 'refunded') {
                $description = "Refund processed for Invoice #{$ref}";
            } elseif ($status === 'unpaid' || $status === 'failed') {
                $description = "Invoice marked as Unpaid for Invoice #{$ref}";
            } else {
                $description = "Invoice marked as Pending for Invoice #{$ref}";
            }
        }

        // Check for existing linked transaction(s)
        $transactions = $payment->transactions()->get();

        if ($transactions->isNotEmpty()) {
            $primary = $transactions->first();

            $existingPayload = is_array($primary->gateway_response) ? $primary->gateway_response : [];
            $updatedPayload = array_merge($existingPayload, [
                'payment_method'      => $methodLabel,
                'method_code'         => $methodCode,
                'status'              => $txStatus,
                'amount'              => $amount,
                'invoice_ref'         => $ref,
                'updated_in_place_at' => now()->toIso8601String(),
            ]);

            if ($notes !== null) {
                $updatedPayload['notes'] = $notes;
            }

            $txUpdates = [
                'type'             => $txType,
                'status'           => $txStatus,
                'amount'           => $amount,
                'description'      => $description,
                'gateway_response' => $updatedPayload,
            ];

            if ($userId) {
                $txUpdates['processed_by_user_id'] = $userId;
            }

            $primary->update($txUpdates);

            // Clean up any stale duplicate entries from past testing to guarantee strict 1-to-1 linkage
            if ($transactions->count() > 1) {
                $payment->transactions()->where('id', '!=', $primary->id)->delete();
            }

            return $primary;
        }

        // If no linked transaction exists yet, create the single linked record
        return Transaction::create([
            'payment_id'           => $payment->id,
            'type'                 => $txType,
            'amount'               => $amount,
            'status'               => $txStatus,
            'description'          => $description,
            'gateway_response'     => [
                'payment_method' => $methodLabel,
                'method_code'    => $methodCode,
                'status'         => $txStatus,
                'amount'         => $amount,
                'invoice_ref'    => $ref,
                'notes'          => $notes,
                'recorded_at'    => now()->toIso8601String(),
            ],
            'processed_by_user_id' => $userId,
        ]);
    }

    /**
     * Format payment method code into clean human label.
     */
    protected function formatPaymentMethodLabel(?string $method): string
    {
        if (empty($method)) {
            return 'Online Gateway';
        }

        $m = strtolower(trim($method));
        return match ($m) {
            'cash'                      => 'Cash',
            'card', 'credit_card'       => 'Credit Card',
            'bank_transfer', 'bank'     => 'Bank Transfer',
            'online', 'adcb_pace_pay'   => 'Online Gateway',
            default                     => ucwords(str_replace('_', ' ', $method)),
        };
    }

    /**
     * Normalize payment method input to recognized database code.
     */
    protected function normalizePaymentMethodCode(?string $method): string
    {
        if (empty($method)) {
            return 'adcb_pace_pay';
        }

        $m = strtolower(trim($method));
        return match ($m) {
            'cash'                      => 'cash',
            'card', 'credit_card'       => 'card',
            'bank_transfer', 'bank'     => 'bank_transfer',
            'online', 'adcb_pace_pay'   => 'adcb_pace_pay',
            default                     => $method,
        };
    }
}
