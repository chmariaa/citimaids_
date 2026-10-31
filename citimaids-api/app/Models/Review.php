<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $fillable = [
        'name',
        'whatsapp',
        'location',
        'stars',
        'body',
        'status',
    ];

    protected $casts = [
        'stars' => 'integer',
    ];

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }
}
