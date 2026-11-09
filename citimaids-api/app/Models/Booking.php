<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Booking extends Model
{
    protected $fillable = [
        'client_id',
        'service_id',
        'processed_by_user_id',
        'preferred_date',
        'preferred_time',
        'address',
        'notes',
        'status',
        'total_amount',
        'payment_status',
        'payment_method',
    ];

    protected $casts = [
        'preferred_date' => 'date',
        'total_amount' => 'decimal:2',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by_user_id');
    }

    public function details(): HasMany
    {
        return $this->hasMany(BookingDetail::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
