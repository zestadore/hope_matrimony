<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * The four Hope Matrimony account roles. Permissions are intentionally
     * left for the user-management feature to define later — this pass
     * only establishes the roles themselves.
     */
    private const ROLES = ['super_admin', 'admin', 'accounts', 'user'];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (self::ROLES as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'api']);
        }
    }
}
