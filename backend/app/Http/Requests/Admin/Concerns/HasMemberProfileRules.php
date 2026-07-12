<?php

namespace App\Http\Requests\Admin\Concerns;

use App\Support\MemberOptions;
use Illuminate\Validation\Rule;

/**
 * Nested validation rules for a member's profile/family/residency/education/
 * career/partner-preference payload, shared by StoreUserRequest and
 * UpdateUserRequest. Education level is required both on the member's own
 * education entries and on their partner preference.
 */
trait HasMemberProfileRules
{
    /**
     * @return array<string, mixed>
     */
    protected function memberProfileRules(): array
    {
        return [
            'profile' => ['required', 'array'],
            'profile.gender' => ['required', Rule::in(MemberOptions::GENDERS)],
            'profile.date_of_birth' => ['required', 'date', 'before:today'],
            'profile.marital_status' => ['nullable', Rule::in(MemberOptions::MARITAL_STATUSES)],
            'profile.children' => ['nullable', 'integer', 'min:0', 'max:20'],
            'profile.on_behalf' => ['nullable', Rule::in(MemberOptions::ON_BEHALF)],
            'profile.mother_tongue' => ['nullable', Rule::in(MemberOptions::LANGUAGES)],
            'profile.known_languages' => ['nullable', 'array'],
            'profile.known_languages.*' => [Rule::in(MemberOptions::LANGUAGES)],
            'profile.introduction' => ['nullable', 'string'],
            'profile.height_cm' => ['nullable', 'integer', 'min:50', 'max:250'],
            'profile.weight_kg' => ['nullable', 'numeric', 'min:20', 'max:300'],
            'profile.complexion' => ['nullable', Rule::in(MemberOptions::COMPLEXIONS)],
            'profile.body_type' => ['nullable', Rule::in(MemberOptions::BODY_TYPES)],
            'profile.blood_group' => ['nullable', Rule::in(MemberOptions::BLOOD_GROUPS)],
            'profile.disability' => ['nullable', 'string', 'max:255'],
            'profile.diet' => ['nullable', Rule::in(MemberOptions::DIETS)],
            'profile.drink' => ['nullable', Rule::in(MemberOptions::HABIT_LEVELS)],
            'profile.smoke' => ['nullable', Rule::in(MemberOptions::HABIT_LEVELS)],
            'profile.living_with' => ['nullable', Rule::in(MemberOptions::LIVING_WITH)],
            'profile.time_of_birth' => ['nullable', 'string', 'max:20'],
            'profile.birth_city' => ['nullable', 'string', 'max:100'],
            'profile.malayalam_star' => ['nullable', Rule::in(MemberOptions::MALAYALAM_STARS)],
            'profile.manglik' => ['nullable', Rule::in(MemberOptions::MANGLIK)],
            'profile.sudha_jathakam' => ['nullable', Rule::in(MemberOptions::MANGLIK)],
            'profile.jathakam_path' => ['nullable', 'string', 'max:255'],
            'profile.jathakam_original_name' => ['nullable', 'string', 'max:255'],
            'profile.hobbies' => ['nullable', 'string'],
            'profile.interests' => ['nullable', 'string'],
            'profile.music' => ['nullable', 'string'],
            'profile.movies' => ['nullable', 'string'],
            'profile.sports' => ['nullable', 'string'],
            'profile.cuisines' => ['nullable', 'string'],

            'family' => ['nullable', 'array'],
            'family.religion_id' => ['nullable', 'integer', Rule::exists('religions', 'id')],
            'family.caste_id' => ['nullable', 'integer', Rule::exists('castes', 'id')],
            'family.sub_caste' => ['nullable', 'string', 'max:255'],
            'family.community_value' => ['nullable', 'string', 'max:255'],
            'family.father_name' => ['nullable', 'string', 'max:255'],
            'family.mother_name' => ['nullable', 'string', 'max:255'],
            'family.siblings' => ['nullable', 'string', 'max:255'],
            'family.family_status' => ['nullable', Rule::in(MemberOptions::FAMILY_STATUSES)],
            'family.family_value' => ['nullable', Rule::in(MemberOptions::FAMILY_VALUES)],

            'residency' => ['nullable', 'array'],
            'residency.native_state_id' => ['nullable', 'integer', Rule::exists('states', 'id')],
            'residency.native_district_id' => ['nullable', 'integer', Rule::exists('districts', 'id')],
            'residency.current_state_id' => ['nullable', 'integer', Rule::exists('states', 'id')],
            'residency.current_district_id' => ['nullable', 'integer', Rule::exists('districts', 'id')],
            'residency.current_address' => ['nullable', 'string'],
            'residency.postal_code' => ['nullable', 'string', 'max:20'],
            'residency.immigration_status' => ['nullable', 'string', 'max:255'],

            'educations' => ['required', 'array', 'min:1'],
            'educations.*.education_level_id' => ['required', 'integer', Rule::exists('education_levels', 'id')],
            'educations.*.qualification_id' => ['nullable', 'integer', Rule::exists('qualifications', 'id')],
            'educations.*.institution' => ['nullable', 'string', 'max:255'],
            'educations.*.start_year' => ['nullable', 'integer', 'min:1950', 'max:2100'],
            'educations.*.end_year' => ['nullable', 'integer', 'min:1950', 'max:2100'],
            'educations.*.is_current' => ['nullable', 'boolean'],

            'careers' => ['nullable', 'array'],
            'careers.*.designation' => ['nullable', 'string', 'max:255'],
            'careers.*.company' => ['nullable', 'string', 'max:255'],
            'careers.*.industry_id' => ['nullable', 'integer', Rule::exists('industries', 'id')],
            'careers.*.start_year' => ['nullable', 'integer', 'min:1950', 'max:2100'],
            'careers.*.end_year' => ['nullable', 'integer', 'min:1950', 'max:2100'],
            'careers.*.is_current' => ['nullable', 'boolean'],

            'partner_preference' => ['required', 'array'],
            'partner_preference.age_from' => ['nullable', 'integer', 'min:18', 'max:100'],
            'partner_preference.age_to' => ['nullable', 'integer', 'min:18', 'max:100', 'gte:partner_preference.age_from'],
            'partner_preference.height_from_cm' => ['nullable', 'integer', 'min:50', 'max:250'],
            'partner_preference.height_to_cm' => ['nullable', 'integer', 'min:50', 'max:250', 'gte:partner_preference.height_from_cm'],
            'partner_preference.marital_status' => ['nullable', Rule::in(MemberOptions::MARITAL_STATUSES)],
            'partner_preference.children_acceptable' => ['nullable', Rule::in(MemberOptions::CHILDREN_ACCEPTABLE)],
            'partner_preference.religion_id' => ['nullable', 'integer', Rule::exists('religions', 'id')],
            'partner_preference.caste_id' => ['nullable', 'integer', Rule::exists('castes', 'id')],
            'partner_preference.sub_caste' => ['nullable', 'string', 'max:255'],
            'partner_preference.education_level_id' => ['required', 'integer', Rule::exists('education_levels', 'id')],
            'partner_preference.industry_id' => ['nullable', 'integer', Rule::exists('industries', 'id')],
            'partner_preference.diet' => ['nullable', Rule::in(MemberOptions::DIETS)],
            'partner_preference.smoking_acceptable' => ['nullable', Rule::in(MemberOptions::HABIT_LEVELS)],
            'partner_preference.drinking_acceptable' => ['nullable', Rule::in(MemberOptions::HABIT_LEVELS)],
            'partner_preference.body_type' => ['nullable', Rule::in(MemberOptions::BODY_TYPES)],
            'partner_preference.complexion' => ['nullable', Rule::in(MemberOptions::COMPLEXIONS)],
            'partner_preference.manglik' => ['nullable', Rule::in(MemberOptions::MANGLIK)],
            'partner_preference.mother_tongue' => ['nullable', Rule::in(MemberOptions::LANGUAGES)],
            'partner_preference.family_value' => ['nullable', Rule::in(MemberOptions::FAMILY_VALUES)],
            'partner_preference.preferred_state_id' => ['nullable', 'integer', Rule::exists('states', 'id')],
            'partner_preference.general' => ['nullable', 'string'],
        ];
    }
}
