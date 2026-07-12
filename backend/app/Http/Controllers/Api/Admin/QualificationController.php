<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreQualificationRequest;
use App\Http\Requests\Admin\UpdateQualificationRequest;
use App\Models\Qualification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QualificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = $request->string('search')->trim()->toString();
        $educationLevelId = $request->integer('education_level_id');

        $qualifications = Qualification::with('educationLevel')
            ->when($educationLevelId, fn ($query) => $query->where('education_level_id', $educationLevelId))
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->paginate(20);

        return response()->json([
            'qualifications' => $qualifications->getCollection()->map(
                fn (Qualification $qualification) => $this->presentQualification($qualification),
            ),
            'meta' => [
                'current_page' => $qualifications->currentPage(),
                'last_page' => $qualifications->lastPage(),
                'total' => $qualifications->total(),
            ],
        ]);
    }

    public function store(StoreQualificationRequest $request): JsonResponse
    {
        $qualification = Qualification::create($request->validated());

        return response()->json([
            'qualification' => $this->presentQualification($qualification->load('educationLevel')),
        ], 201);
    }

    public function update(UpdateQualificationRequest $request, Qualification $qualification): JsonResponse
    {
        $qualification->update($request->validated());

        return response()->json([
            'qualification' => $this->presentQualification($qualification->load('educationLevel')),
        ]);
    }

    public function destroy(Qualification $qualification): JsonResponse
    {
        $qualification->delete();

        return response()->json(['message' => 'Qualification deleted.']);
    }

    private function presentQualification(Qualification $qualification): array
    {
        return [
            'id' => $qualification->id,
            'name' => $qualification->name,
            'education_level_id' => $qualification->education_level_id,
            'education_level_name' => $qualification->educationLevel->name,
        ];
    }
}
