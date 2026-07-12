<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['religion_id', 'name'])]
class Caste extends Model
{
    public function religion(): BelongsTo
    {
        return $this->belongsTo(Religion::class);
    }
}
