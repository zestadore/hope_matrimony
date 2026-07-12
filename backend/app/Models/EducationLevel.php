<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'sort_order'])]
class EducationLevel extends Model
{
    public function qualifications(): HasMany
    {
        return $this->hasMany(Qualification::class);
    }
}
