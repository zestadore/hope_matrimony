<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'education_level_id', 'qualification_id', 'institution', 'start_year', 'end_year', 'is_current',
])]
class MemberEducation extends Model
{
    // "education" is an uncountable noun to Laravel's pluralizer, so the
    // default table name would resolve to "member_education" without this.
    protected $table = 'member_educations';

    protected function casts(): array
    {
        return [
            'is_current' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function educationLevel(): BelongsTo
    {
        return $this->belongsTo(EducationLevel::class);
    }

    public function qualification(): BelongsTo
    {
        return $this->belongsTo(Qualification::class);
    }
}
