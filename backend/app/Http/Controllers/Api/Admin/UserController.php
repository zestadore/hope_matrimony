<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SyncUserRolesRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    private const PROTECTED_ROLE = 'super_admin';

    public function index(Request $request): JsonResponse
    {
        $search = $request->string('search')->trim()->toString();

        $users = User::with('roles')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('mobile_number', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(20);

        return response()->json([
            'users' => $users->getCollection()->map(fn (User $user) => $this->presentUser($user)),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function updateRoles(SyncUserRolesRequest $request, User $user): JsonResponse
    {
        $newRoles = $request->input('roles', []);
        $isRemovingSuperAdmin = $user->hasRole(self::PROTECTED_ROLE) && ! in_array(self::PROTECTED_ROLE, $newRoles, true);

        if ($isRemovingSuperAdmin) {
            if ($request->user()->id === $user->id) {
                return response()->json([
                    'message' => 'You cannot remove your own Super Admin role.',
                ], 422);
            }

            $remainingSuperAdmins = User::role(self::PROTECTED_ROLE)->where('id', '!=', $user->id)->exists();

            if (! $remainingSuperAdmins) {
                return response()->json([
                    'message' => 'At least one Super Admin must remain.',
                ], 422);
            }
        }

        $user->syncRoles($newRoles);

        return response()->json(['user' => $this->presentUser($user->load('roles'))]);
    }

    private function presentUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'mobile_number' => $user->mobile_number,
            'email' => $user->email,
            'status' => $user->status,
            'roles' => $user->getRoleNames(),
        ];
    }
}
