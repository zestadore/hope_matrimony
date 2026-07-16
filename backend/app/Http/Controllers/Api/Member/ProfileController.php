<?php

namespace App\Http\Controllers\Api\Member;

use App\Http\Controllers\Controller;
use App\Http\Requests\Member\UpdateProfileRequest;
use App\Models\MemberCareer;
use App\Models\MemberEducation;
use App\Models\MemberPhoto;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    private const RELATIONS = [
        'profile', 'familyDetail', 'residency', 'partnerPreference',
        'educations.educationLevel', 'educations.qualification',
        'careers.industry', 'photos',
    ];

    private const MAX_PHOTOS = 4;

    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load(self::RELATIONS);

        return response()->json([
            'profile' => $user->profile,
            'family' => $user->familyDetail,
            'residency' => $user->residency,
            'partner_preference' => $user->partnerPreference,
            'educations' => $user->educations,
            'careers' => $user->careers,
            'photos' => $user->photos,
        ]);
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        DB::transaction(function () use ($user, $data) {
            $this->saveProfileData($user, $data);
        });

        $user = $user->fresh(self::RELATIONS);

        return response()->json([
            'profile' => $user->profile,
            'family' => $user->familyDetail,
            'residency' => $user->residency,
            'partner_preference' => $user->partnerPreference,
            'educations' => $user->educations,
            'careers' => $user->careers,
            'photos' => $user->photos,
        ]);
    }

    public function uploadPhoto(Request $request): JsonResponse
    {
        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $user = $request->user();

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

    public function destroyPhoto(Request $request, MemberPhoto $photo): JsonResponse
    {
        $user = $request->user();

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

    private function photosResponse(User $user): JsonResponse
    {
        return response()->json([
            'photos' => $user->photos()->get(),
        ]);
    }

    /**
     * Each profile-editor screen saves exactly one section, so the request
     * only ever contains that section's top-level key. Only touch whatever
     * is actually present — sections the client didn't send are left as-is.
     *
     * @param  array<string, mixed>  $data
     */
    private function saveProfileData(User $user, array $data): void
    {
        if (array_key_exists('profile', $data)) {
            $user->profile()->updateOrCreate([], $data['profile']);
        }

        if (array_key_exists('family', $data)) {
            $user->familyDetail()->updateOrCreate([], $data['family']);
        }

        if (array_key_exists('residency', $data)) {
            $user->residency()->updateOrCreate([], $data['residency']);
        }

        if (array_key_exists('partner_preference', $data)) {
            $user->partnerPreference()->updateOrCreate([], $data['partner_preference']);
        }

        if (array_key_exists('educations', $data)) {
            $user->educations()->delete();
            foreach ($data['educations'] as $education) {
                $user->educations()->save(new MemberEducation($education));
            }
        }

        if (array_key_exists('careers', $data)) {
            $user->careers()->delete();
            foreach ($data['careers'] as $career) {
                $user->careers()->save(new MemberCareer($career));
            }
        }
    }
}
