<?php

namespace Database\Seeders;

use App\Models\Religion;
use Illuminate\Database\Seeder;

class ReligionSeeder extends Seeder
{
    /**
     * The standard religion list used across Indian matrimony platforms.
     * Castes are deliberately not seeded here — there is no single
     * authoritative list, so admins add them per religion as needed.
     */
    private const RELIGIONS = [
        'Hindu',
        'Muslim',
        'Christian',
        'Sikh',
        'Buddhist',
        'Jain',
        'Parsi',
        'Jewish',
        'No Religion',
        'Other',
    ];

    public function run(): void
    {
        foreach (self::RELIGIONS as $religion) {
            Religion::firstOrCreate(['name' => $religion]);
        }
    }
}
