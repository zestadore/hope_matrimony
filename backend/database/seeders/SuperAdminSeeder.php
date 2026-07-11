<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $mobileNumber = (string) config('security.super_admin.mobile');
        $password = (string) config('security.super_admin.password');

        $user = User::firstOrCreate(
            ['mobile_number' => $mobileNumber],
            [
                'name' => 'Super Admin',
                'password' => $password,
                'status' => 'active',
            ],
        );

        if (! $user->hasRole('super_admin')) {
            $user->assignRole('super_admin');
        }
    }
}
