<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreRoleRequest;
use App\Http\Requests\Admin\UpdateRoleRequest;
use Illuminate\Http\JsonResponse;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * The super_admin role is a fixed system role — it must always retain
     * every permission and can't be reassigned away, so it can't be renamed
     * or deleted through this API.
     */
    private const PROTECTED_ROLE = 'super_admin';

    public function index(): JsonResponse
    {
        $roles = Role::with('permissions')->withCount('users')->orderBy('name')->get();

        return response()->json([
            'roles' => $roles->map(fn (Role $role) => $this->presentRole($role)),
        ]);
    }

    public function show(Role $role): JsonResponse
    {
        $role->loadMissing('permissions')->loadCount('users');

        return response()->json(['role' => $this->presentRole($role)]);
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        $role = Role::create([
            'name' => $request->string('name')->toString(),
            'guard_name' => 'api',
        ]);
        $role->syncPermissions($request->input('permissions', []));

        return response()->json([
            'role' => $this->presentRole($role->load('permissions')->loadCount('users')),
        ], 201);
    }

    public function update(UpdateRoleRequest $request, Role $role): JsonResponse
    {
        if ($role->name === self::PROTECTED_ROLE) {
            return response()->json(['message' => 'The Super Admin role cannot be modified.'], 422);
        }

        $role->update(['name' => $request->string('name')->toString()]);
        $role->syncPermissions($request->input('permissions', []));

        return response()->json([
            'role' => $this->presentRole($role->load('permissions')->loadCount('users')),
        ]);
    }

    public function destroy(Role $role): JsonResponse
    {
        if ($role->name === self::PROTECTED_ROLE) {
            return response()->json(['message' => 'The Super Admin role cannot be deleted.'], 422);
        }

        $role->delete();

        return response()->json(['message' => 'Role deleted.']);
    }

    private function presentRole(Role $role): array
    {
        return [
            'id' => $role->id,
            'name' => $role->name,
            'permissions' => $role->permissions->pluck('name'),
            'users_count' => $role->users_count ?? 0,
            'protected' => $role->name === self::PROTECTED_ROLE,
        ];
    }
}
