<?php

namespace Database\Seeders;

use App\Models\Industry;
use Illuminate\Database\Seeder;

class IndustrySeeder extends Seeder
{
    /**
     * Starter list of common industries used on Indian matrimony platforms
     * for both a user's own work industry and partner-preference filters.
     * Admins can add more over time.
     */
    private const INDUSTRIES = [
        'Agriculture',
        'Airlines / Aviation',
        'Animation / Multimedia',
        'Architecture / Interior Design',
        'Banking / Finance',
        'Beauty / Fashion Designing',
        'BPO / ITES',
        'Civil Services / Government',
        'Defence',
        'Education / Training',
        'Engineering',
        'Entertainment / Media / Journalism',
        'Export / Import',
        'Fine Arts',
        'Hotel / Hospitality',
        'Human Resources',
        'Information Technology / Software',
        'Insurance',
        'Legal / Law',
        'Manufacturing',
        'Marketing / Advertising / PR',
        'Medical / Healthcare',
        'Merchant Navy',
        'Oil & Gas / Petroleum',
        'Pharmaceutical / Biotechnology',
        'Real Estate',
        'Retail / Business',
        'Self Employed / Business Owner',
        'Sports',
        'Student',
        'Telecommunications',
        'Textile',
        'Transport / Logistics',
        'Travel / Tourism',
        'Not Working',
        'Homemaker',
        'Retired',
        'Other',
    ];

    public function run(): void
    {
        foreach (self::INDUSTRIES as $industry) {
            Industry::firstOrCreate(['name' => $industry]);
        }
    }
}
