<?php

namespace Database\Seeders;

use App\Models\EducationLevel;
use App\Models\Qualification;
use Illuminate\Database\Seeder;

class EducationLevelSeeder extends Seeder
{
    /**
     * Education levels in ascending order, each with a starter set of common
     * degrees. Admins can add more qualifications under each level over time.
     *
     * @var array<int, array{name: string, qualifications: array<int, string>}>
     */
    private const LEVELS = [
        ['name' => 'High School', 'qualifications' => ['SSLC / 10th']],
        ['name' => 'Intermediate / Pre-University', 'qualifications' => ['HSC / 12th']],
        ['name' => 'Diploma', 'qualifications' => [
            'Polytechnic Diploma', 'ITI', 'Diploma in Education',
        ]],
        ['name' => "Bachelor's Degree", 'qualifications' => [
            'B.A', 'B.Sc', 'B.Com', 'B.Tech / B.E', 'BBA', 'BCA', 'LLB', 'B.Pharm', 'BDS', 'MBBS',
            'B.Ed', 'B.Arch',
        ]],
        ['name' => "Master's Degree", 'qualifications' => [
            'M.A', 'M.Sc', 'M.Com', 'M.Tech / M.E', 'MBA', 'MCA', 'LLM', 'M.Pharm', 'MD / MS', 'M.Ed',
        ]],
        ['name' => 'Doctorate', 'qualifications' => ['Ph.D', 'D.Sc', 'DM', 'MCh']],
        ['name' => 'Professional Degree', 'qualifications' => ['CA', 'CS', 'CMA', 'CFA']],
        ['name' => 'Vocational Training', 'qualifications' => []],
        ['name' => 'Other', 'qualifications' => []],
    ];

    public function run(): void
    {
        foreach (self::LEVELS as $index => $entry) {
            $level = EducationLevel::updateOrCreate(
                ['name' => $entry['name']],
                ['sort_order' => $index],
            );

            foreach ($entry['qualifications'] as $qualification) {
                Qualification::firstOrCreate(['education_level_id' => $level->id, 'name' => $qualification]);
            }
        }
    }
}
