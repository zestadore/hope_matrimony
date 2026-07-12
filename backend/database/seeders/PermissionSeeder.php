<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    /**
     * The permission taxonomy, scoped to what the admin panel actually
     * supports today. New modules should extend this list as they land.
     */
    private const PERMISSIONS = [
        'roles.view',
        'roles.create',
        'roles.update',
        'roles.delete',
        'permissions.view',
        'users.view',
        'users.assign-roles',
        'castes.view',
        'castes.create',
        'castes.update',
        'castes.delete',
        'qualifications.view',
        'qualifications.create',
        'qualifications.update',
        'qualifications.delete',
        'industries.view',
        'industries.create',
        'industries.update',
        'industries.delete',
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (self::PERMISSIONS as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'api']);
        }

        // Only Super Admin can manage roles/permissions and assign roles to
        // users. Other roles start with none of these permissions.
        $superAdmin = Role::where('name', 'super_admin')->where('guard_name', 'api')->first();
        $superAdmin?->syncPermissions(self::PERMISSIONS);
    }
}
