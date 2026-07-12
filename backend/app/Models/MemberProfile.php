<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'gender', 'date_of_birth', 'marital_status', 'children', 'on_behalf', 'mother_tongue',
    'known_languages', 'introduction', 'height_cm', 'weight_kg', 'complexion', 'body_type',
    'blood_group', 'disability', 'diet', 'drink', 'smoke', 'living_with',
    'time_of_birth', 'birth_city', 'malayalam_star', 'manglik', 'sudha_jathakam', 'jathakam_path',
    'jathakam_original_name', 'hobbies', 'interests', 'music', 'movies', 'sports', 'cuisines',
])]
class MemberProfile extends Model
{
    /**
     * Prefix for the human-facing member id (e.g. HMTR15103342).
     */
    private const PROFILE_ID_PREFIX = 'HMTR';

    protected static function booted(): void
    {
        // Assign the public member id on creation. Done here rather than in the
        // controller so every create path (including updateOrCreate) gets one,
        // and it's kept out of $fillable so it can never be mass-assigned.
        static::creating(function (MemberProfile $profile): void {
            if (empty($profile->profile_id)) {
                $profile->profile_id = static::generateProfileId();
            }
        });
    }

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'known_languages' => 'array',
        ];
    }

    /**
     * Generate a unique random member id, e.g. HMTR15103342.
     */
    public static function generateProfileId(): string
    {
        do {
            $candidate = self::PROFILE_ID_PREFIX.random_int(10_000_000, 99_999_999);
        } while (static::where('profile_id', $candidate)->exists());

        return $candidate;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
