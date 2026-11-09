<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    protected $fillable = [
        'name',
        'category',
        'description',
        'base_price',
        'icon',
        'status',
        'display_order',
    ];

    // Always return services ordered by display_order by default
    protected static function booted(): void
    {
        static::creating(function ($service) {
            if (empty($service->display_order)) {
                $service->display_order = (static::max('display_order') ?? 0) + 1;
            }
        });
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function bookingDetails(): HasMany
    {
        return $this->hasMany(BookingDetail::class);
    }
}
