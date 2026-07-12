<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'age_from', 'age_to', 'height_from_cm', 'height_to_cm', 'marital_status', 'children_acceptable',
    'religion_id', 'caste_id', 'sub_caste', 'education_level_id', 'industry_id', 'diet',
    'smoking_acceptable', 'drinking_acceptable', 'body_type', 'complexion', 'manglik', 'mother_tongue',
    'family_value', 'preferred_state_id', 'general',
])]
class MemberPartnerPreference extends Model
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

    public function educationLevel(): BelongsTo
    {
        return $this->belongsTo(EducationLevel::class);
    }

    public function industry(): BelongsTo
    {
        return $this->belongsTo(Industry::class);
    }

    public function preferredState(): BelongsTo
    {
        return $this->belongsTo(State::class, 'preferred_state_id');
    }
}
