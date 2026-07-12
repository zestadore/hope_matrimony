<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCasteRequest;
use App\Http\Requests\Admin\UpdateCasteRequest;
use App\Models\Caste;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CasteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = $request->string('search')->trim()->toString();
        $religionId = $request->integer('religion_id');

        $castes = Caste::with('religion')
            ->when($religionId, fn ($query) => $query->where('religion_id', $religionId))
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->paginate(20);

        return response()->json([
            'castes' => $castes->getCollection()->map(fn (Caste $caste) => $this->presentCaste($caste)),
            'meta' => [
                'current_page' => $castes->currentPage(),
                'last_page' => $castes->lastPage(),
                'total' => $castes->total(),
            ],
        ]);
    }

    public function store(StoreCasteRequest $request): JsonResponse
    {
        $caste = Caste::create($request->validated());

        return response()->json(['caste' => $this->presentCaste($caste->load('religion'))], 201);
    }

    public function update(UpdateCasteRequest $request, Caste $caste): JsonResponse
    {
        $caste->update($request->validated());

        return response()->json(['caste' => $this->presentCaste($caste->load('religion'))]);
    }

    public function destroy(Caste $caste): JsonResponse
    {
        $caste->delete();

        return response()->json(['message' => 'Caste deleted.']);
    }

    private function presentCaste(Caste $caste): array
    {
        return [
            'id' => $caste->id,
            'name' => $caste->name,
            'religion_id' => $caste->religion_id,
            'religion_name' => $caste->religion->name,
        ];
    }
}
