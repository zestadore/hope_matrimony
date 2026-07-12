<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'native_state_id', 'native_district_id', 'current_state_id', 'current_district_id',
    'current_address', 'postal_code', 'immigration_status',
])]
class MemberResidency extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function nativeState(): BelongsTo
    {
        return $this->belongsTo(State::class, 'native_state_id');
    }

    public function nativeDistrict(): BelongsTo
    {
        return $this->belongsTo(District::class, 'native_district_id');
    }

    public function currentState(): BelongsTo
    {
        return $this->belongsTo(State::class, 'current_state_id');
    }

    public function currentDistrict(): BelongsTo
    {
        return $this->belongsTo(District::class, 'current_district_id');
    }
}
