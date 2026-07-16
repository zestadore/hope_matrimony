<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

#[Fillable(['path', 'original_name', 'is_default'])]
class MemberPhoto extends Model
{
    /**
     * `path` holds the location on the public disk (e.g. member-photos/x.jpg),
     * never a full URL — a stored host would pin every row to the environment
     * that happened to accept the upload. The absolute URL is derived per
     * request from APP_URL instead, so the same row serves every environment.
     */
    protected $appends = ['url'];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    protected function url(): Attribute
    {
        return Attribute::get(fn (): string => Storage::disk('public')->url($this->path));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
