<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    /**
     * List every permission, grouped by the prefix before the dot
     * (e.g. "roles" for "roles.create") so the UI can render grouped
     * checkboxes without hardcoding the taxonomy on the frontend.
     */
    public function index(): JsonResponse
    {
        $groups = Permission::orderBy('name')->get()
            ->groupBy(fn (Permission $permission) => explode('.', $permission->name)[0])
            ->map(fn ($permissions) => $permissions->pluck('name')->values());

        return response()->json(['permissions' => $groups]);
    }
}
