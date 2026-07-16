<?php

namespace App\Http\Controllers\Api\Member;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class DashboardController extends Controller
{
    /**
     * Recommended number of photos before that section reads as "done".
     * There's no sub-field structure to a photo, so it's counted like a
     * field-count target instead (1 of 3, 2 of 3, ...).
     */
    private const PHOTO_TARGET_COUNT = 3;

    /**
     * Field lists mirror each profile-editor form 1:1 (verified against
     * each model's #[Fillable] list) so "percent filled" reflects what the
     * member actually left blank, not a same-or-nothing proxy.
     */
    private const BASIC_INFO_FIELDS = [
        'gender', 'date_of_birth', 'marital_status', 'children', 'on_behalf', 'mother_tongue',
        'known_languages', 'introduction', 'height_cm', 'weight_kg', 'complexion', 'body_type',
        'blood_group', 'disability', 'diet', 'drink', 'smoke', 'living_with',
        'time_of_birth', 'birth_city', 'malayalam_star', 'manglik', 'sudha_jathakam',
        'hobbies', 'interests', 'music', 'movies', 'sports', 'cuisines',
    ];

    private const FAMILY_FIELDS = [
        'religion_id', 'caste_id', 'sub_caste', 'community_value', 'father_name', 'mother_name',
        'siblings', 'family_status', 'family_value',
    ];

    private const RESIDENCY_FIELDS = [
        'native_state_id', 'native_district_id', 'current_state_id', 'current_district_id',
        'current_address', 'postal_code', 'immigration_status',
    ];

    private const EDUCATION_FIELDS = [
        'education_level_id', 'qualification_id', 'institution', 'start_year', 'end_year', 'is_current',
    ];

    private const CAREER_FIELDS = [
        'designation', 'company', 'industry_id', 'start_year', 'end_year', 'is_current',
    ];

    private const PARTNER_PREFERENCE_FIELDS = [
        'age_from', 'age_to', 'height_from_cm', 'height_to_cm', 'marital_status', 'children_acceptable',
        'religion_id', 'caste_id', 'sub_caste', 'education_level_id', 'industry_id', 'diet',
        'smoking_acceptable', 'drinking_acceptable', 'body_type', 'complexion', 'manglik', 'mother_tongue',
        'family_value', 'preferred_state_id', 'general',
    ];

    /**
     * Profile-completion summary for the authenticated member's own
     * dashboard. Section weighting is a UX nudge toward a well-rounded
     * profile, not a copy of the admin's (looser) creation validation.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load([
            'profile', 'familyDetail', 'residency', 'educations', 'careers', 'partnerPreference', 'photos',
        ]);

        $sections = [
            $this->section('basic_info', 'Basic info', $this->singleRatio($user->profile, self::BASIC_INFO_FIELDS)),
            $this->section('family', 'Family details', $this->singleRatio($user->familyDetail, self::FAMILY_FIELDS)),
            $this->section('residency', 'Residency', $this->singleRatio($user->residency, self::RESIDENCY_FIELDS)),
            $this->section('education', 'Education', $this->collectionRatio($user->educations, self::EDUCATION_FIELDS)),
            $this->section('career', 'Career', $this->collectionRatio($user->careers, self::CAREER_FIELDS)),
            $this->section(
                'partner_preference',
                'Partner preference',
                $this->singleRatio($user->partnerPreference, self::PARTNER_PREFERENCE_FIELDS),
            ),
            $this->section('photos', 'Photos', min($user->photos->count() / self::PHOTO_TARGET_COUNT, 1.0)),
        ];

        $overallRatio = collect($sections)->avg('percent') / 100;

        return response()->json([
            'member' => [
                'profile_id' => $user->profile?->profile_id,
                'status' => $user->status,
                'member_since' => $user->created_at?->toDateString(),
            ],
            'completion' => [
                'percent' => (int) round($overallRatio * 100),
                'sections' => $sections,
            ],
        ]);
    }

    /**
     * @return array{key: string, label: string, percent: int, complete: bool}
     */
    private function section(string $key, string $label, float $ratio): array
    {
        $percent = (int) round($ratio * 100);

        return [
            'key' => $key,
            'label' => $label,
            'percent' => $percent,
            'complete' => $percent >= 100,
        ];
    }

    /**
     * Fraction of $fields that hold a non-empty value on a has-one section.
     */
    private function singleRatio(?Model $model, array $fields): float
    {
        if ($model === null) {
            return 0.0;
        }

        $filled = collect($fields)->filter(fn (string $field) => $this->isFilled($model->{$field}))->count();

        return $filled / count($fields);
    }

    /**
     * Average per-row fill ratio across a has-many section's existing rows.
     * An entry only counts once it exists, and how thoroughly it's filled
     * in is averaged in rather than requiring every row to be complete.
     */
    private function collectionRatio(Collection $rows, array $fields): float
    {
        if ($rows->isEmpty()) {
            return 0.0;
        }

        return $rows
            ->map(fn (Model $row) => $this->singleRatio($row, $fields))
            ->avg();
    }

    private function isFilled(mixed $value): bool
    {
        if ($value === null) {
            return false;
        }

        if (is_string($value)) {
            return trim($value) !== '';
        }

        if (is_array($value)) {
            return count($value) > 0;
        }

        return true;
    }
}
