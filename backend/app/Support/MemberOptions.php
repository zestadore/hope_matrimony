<?php

namespace App\Support;

/**
 * Fixed-choice lists for member profile fields that don't warrant their own
 * admin-managed lookup table (unlike religions/castes/education levels/etc).
 * Used both for validation (`Rule::in()`) and served as-is by LookupController.
 */
class MemberOptions
{
    public const GENDERS = ['male', 'female'];

    public const MARITAL_STATUSES = ['Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce'];

    public const ON_BEHALF = ['Self', 'Parent', 'Sibling', 'Relative', 'Friend', 'Guardian'];

    public const LANGUAGES = [
        'Hindi', 'English', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Marathi', 'Gujarati',
        'Punjabi', 'Bengali', 'Urdu', 'Odia', 'Assamese', 'Konkani', 'Sindhi', 'Kashmiri',
    ];

    public const COMPLEXIONS = ['Very Fair', 'Fair', 'Wheatish', 'Wheatish Brown', 'Dark'];

    public const BODY_TYPES = ['Slim', 'Athletic', 'Average', 'Heavy'];

    public const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    public const DIETS = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan', 'Jain'];

    public const HABIT_LEVELS = ['No', 'Occasionally', 'Yes'];

    public const LIVING_WITH = ['Family', 'Alone', 'Parents', 'Relatives', 'Roommates'];

    public const MANGLIK = ['Yes', 'No', "Don't Know"];

    public const MALAYALAM_STARS = [
        'Ashwathi', 'Bharani', 'Karthika', 'Rohini', 'Makayiram', 'Thiruvathira', 'Punartham',
        'Pooyam', 'Ayilyam', 'Makam', 'Pooram', 'Uthram', 'Atham', 'Chithira', 'Chothi',
        'Vishakham', 'Anizham', 'Thrikketta', 'Moolam', 'Pooradam', 'Uthradam', 'Thiruvonam',
        'Avittam', 'Chathayam', 'Pooruruttathi', 'Uthrattathi', 'Revathi',
    ];

    public const CHILDREN_ACCEPTABLE = ["Doesn't Matter", 'Yes', 'No'];

    public const FAMILY_VALUES = ['Traditional', 'Moderate', 'Liberal'];

    public const FAMILY_STATUSES = ['Middle Class', 'Upper Middle Class', 'Rich / Affluent'];

    /**
     * @return array<string, array<int, string>>
     */
    public static function all(): array
    {
        return [
            'genders' => self::GENDERS,
            'marital_statuses' => self::MARITAL_STATUSES,
            'on_behalf' => self::ON_BEHALF,
            'languages' => self::LANGUAGES,
            'complexions' => self::COMPLEXIONS,
            'body_types' => self::BODY_TYPES,
            'blood_groups' => self::BLOOD_GROUPS,
            'diets' => self::DIETS,
            'habit_levels' => self::HABIT_LEVELS,
            'living_with' => self::LIVING_WITH,
            'manglik' => self::MANGLIK,
            'malayalam_stars' => self::MALAYALAM_STARS,
            'children_acceptable' => self::CHILDREN_ACCEPTABLE,
            'family_values' => self::FAMILY_VALUES,
            'family_statuses' => self::FAMILY_STATUSES,
        ];
    }
}
