<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'religion_id', 'caste_id', 'sub_caste', 'community_value', 'father_name', 'mother_name',
    'siblings', 'family_status', 'family_value',
])]
class MemberFamilyDetail extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function religion(): BelongsTo
    {
        return $this->belongsTo(Religion::class);
    }

    public function caste(): BelongsTo
    {
        return $this->belongsTo(Caste::class);
    }
}
