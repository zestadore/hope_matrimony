<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\SyncUserRolesRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\MemberCareer;
use App\Models\MemberEducation;
use App\Models\MemberPhoto;
use App\Models\User;
use App\Support\Roles;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    private const PROTECTED_ROLE = 'super_admin';

    private const RELATIONS = [
        'roles', 'profile', 'familyDetail', 'residency', 'partnerPreference',
        'educations.educationLevel', 'educations.qualification',
        'careers.industry', 'photos',
    ];

    private const MAX_PHOTOS = 4;

    public function index(Request $request): JsonResponse
    {
        $search = $request->string('search')->trim()->toString();

        // The listing is split into two segments: matrimonial members (role `user`)
        // and the staff team (super_admin/admin/accounts). Anything other than an
        // explicit `team` request falls back to members.
        $roles = $request->string('segment')->toString() === 'team'
            ? Roles::TEAM
            : Roles::MEMBER;

        $users = User::with(['roles', 'profile', 'educations.educationLevel', 'photos'])
            ->role($roles)
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

    public function show(User $user): JsonResponse
    {
        return response()->json([
            'user' => $this->presentUserDetail($user->load(self::RELATIONS)),
        ]);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request) {
            // `status` isn't in User's mass-assignable list (regular flows
            // shouldn't set it), but an admin explicitly setting it here is
            // legitimate, so it's force-filled rather than mass-assigned.
            $user = new User();
            $user->forceFill([
                'name' => $request->string('name')->toString(),
                'mobile_number' => $request->string('mobile_number')->toString(),
                'email' => $request->input('email'),
                'password' => Hash::make($request->string('password')->toString()),
                'status' => $request->string('status')->toString(),
            ])->save();

            $role = $request->string('role')->toString();
            $user->assignRole($role);

            // Team accounts (super_admin/admin/accounts) have no matrimonial
            // profile — only members do.
            if (! Roles::isTeam($role)) {
                $this->saveProfileData($user, $request->validated());
            }

            return $user;
        });

        return response()->json([
            'user' => $this->presentUserDetail($user->load(self::RELATIONS)),
        ], 201);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        DB::transaction(function () use ($request, $user) {
            $user->forceFill([
                'name' => $request->string('name')->toString(),
                'mobile_number' => $request->string('mobile_number')->toString(),
                'email' => $request->input('email'),
                'status' => $request->string('status')->toString(),
                ...($request->filled('password')
                    ? ['password' => Hash::make($request->string('password')->toString())]
                    : []),
            ])->save();

            $role = $request->string('role')->toString();
            $user->syncRoles([$role]);

            if (! Roles::isTeam($role)) {
                $this->saveProfileData($user, $request->validated());
            }
        });

        return response()->json([
            'user' => $this->presentUserDetail($user->load(self::RELATIONS)),
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($request->user()->id === $user->id) {
            return response()->json([
                'message' => 'You cannot delete your own account.',
            ], 422);
        }

        if ($user->hasRole(self::PROTECTED_ROLE)) {
            $remainingSuperAdmins = User::role(self::PROTECTED_ROLE)->where('id', '!=', $user->id)->exists();

            if (! $remainingSuperAdmins) {
                return response()->json([
                    'message' => 'At least one Super Admin must remain.',
                ], 422);
            }
        }

        // Child rows cascade via FK, but the uploaded files on disk do not —
        // remove them before deleting the user so they aren't left orphaned.
        if ($user->profile?->jathakam_path) {
            $this->deleteJathakamFile($user->profile->jathakam_path);
        }

        foreach ($user->photos as $photo) {
            Storage::disk('public')->delete($photo->path);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }

    public function uploadJathakam(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'jathakam' => ['required', 'file', 'mimes:jpg,jpeg,pdf', 'max:5120'],
        ]);

        $profile = $user->profile;

        if (! $profile) {
            return response()->json([
                'message' => 'Save the member profile before uploading a horoscope.',
            ], 422);
        }

        if ($profile->jathakam_path) {
            $this->deleteJathakamFile($profile->jathakam_path);
        }

        $file = $request->file('jathakam');
        $path = $file->store('jathakams', 'public');

        $profile->update([
            'jathakam_path' => Storage::disk('public')->url($path),
            'jathakam_original_name' => $file->getClientOriginalName(),
        ]);

        return response()->json([
            'jathakam_path' => $profile->jathakam_path,
            'jathakam_original_name' => $profile->jathakam_original_name,
        ]);
    }

    public function destroyJathakam(User $user): JsonResponse
    {
        $profile = $user->profile;

        if ($profile?->jathakam_path) {
            $this->deleteJathakamFile($profile->jathakam_path);
            $profile->update(['jathakam_path' => null, 'jathakam_original_name' => null]);
        }

        return response()->json(['message' => 'Horoscope removed.']);
    }

    private function deleteJathakamFile(string $url): void
    {
        Storage::disk('public')->delete('jathakams/'.basename(parse_url($url, PHP_URL_PATH)));
    }

    public function uploadPhoto(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        if ($user->photos()->count() >= self::MAX_PHOTOS) {
            return response()->json([
                'message' => 'A member can have at most '.self::MAX_PHOTOS.' photos.',
            ], 422);
        }

        $file = $request->file('photo');
        $path = $file->store('member-photos', 'public');

        $user->photos()->create([
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            // The first photo added becomes the default profile photo.
            'is_default' => $user->photos()->count() === 0,
        ]);

        return $this->photosResponse($user);
    }

    public function destroyPhoto(User $user, MemberPhoto $photo): JsonResponse
    {
        if ($photo->user_id !== $user->id) {
            abort(404);
        }

        Storage::disk('public')->delete($photo->path);
        $wasDefault = $photo->is_default;
        $photo->delete();

        // If the default was removed, promote the next remaining photo so the
        // member always has a profile photo when any photos exist.
        if ($wasDefault) {
            $next = $user->photos()->first();
            $next?->update(['is_default' => true]);
        }

        return $this->photosResponse($user);
    }

    public function setDefaultPhoto(User $user, MemberPhoto $photo): JsonResponse
    {
        if ($photo->user_id !== $user->id) {
            abort(404);
        }

        $user->photos()->update(['is_default' => false]);
        $photo->update(['is_default' => true]);

        return $this->photosResponse($user);
    }

    private function photosResponse(User $user): JsonResponse
    {
        return response()->json([
            'photos' => $user->photos()->get(),
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

    /**
     * @param  array<string, mixed>  $data
     */
    private function saveProfileData(User $user, array $data): void
    {
        $user->profile()->updateOrCreate([], $data['profile']);
        $user->familyDetail()->updateOrCreate([], $data['family'] ?? []);
        $user->residency()->updateOrCreate([], $data['residency'] ?? []);
        $user->partnerPreference()->updateOrCreate([], $data['partner_preference']);

        $user->educations()->delete();
        foreach ($data['educations'] as $education) {
            $user->educations()->save(new MemberEducation($education));
        }

        $user->careers()->delete();
        foreach ($data['careers'] ?? [] as $career) {
            $user->careers()->save(new MemberCareer($career));
        }
    }

    private function presentUser(User $user): array
    {
        $primaryEducation = $this->primaryEducation($user);

        return [
            'id' => $user->id,
            'profile_id' => $user->profile?->profile_id,
            'name' => $user->name,
            'mobile_number' => $user->mobile_number,
            'email' => $user->email,
            'status' => $user->status,
            'roles' => $user->getRoleNames(),
            'gender' => $user->profile?->gender,
            'age' => $user->profile?->date_of_birth?->age,
            'education_level_name' => $primaryEducation?->educationLevel?->name,
            'profile_photo' => $this->defaultPhotoPath($user),
        ];
    }

    private function defaultPhotoPath(User $user): ?string
    {
        // Avoid an N+1 lazy-load: only report the photo when it was eager loaded.
        if (! $user->relationLoaded('photos')) {
            return null;
        }

        $photos = $user->photos;

        return ($photos->firstWhere('is_default', true) ?? $photos->first())?->url;
    }

    private function presentUserDetail(User $user): array
    {
        return [
            ...$this->presentUser($user),
            'profile' => $user->profile,
            'family' => $user->familyDetail,
            'residency' => $user->residency,
            'partner_preference' => $user->partnerPreference,
            'educations' => $user->educations,
            'careers' => $user->careers,
            'photos' => $user->photos,
        ];
    }

    private function primaryEducation(User $user): ?MemberEducation
    {
        return $user->educations
            ->sortByDesc(fn (MemberEducation $education) => [$education->is_current, $education->end_year ?? 0, $education->id])
            ->first();
    }
}
