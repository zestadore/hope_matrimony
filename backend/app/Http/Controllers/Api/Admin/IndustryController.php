<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreIndustryRequest;
use App\Http\Requests\Admin\UpdateIndustryRequest;
use App\Models\Industry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IndustryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = $request->string('search')->trim()->toString();

        $industries = Industry::when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->paginate(20);

        return response()->json([
            'industries' => $industries->getCollection()->map(
                fn (Industry $industry) => $this->presentIndustry($industry),
            ),
            'meta' => [
                'current_page' => $industries->currentPage(),
                'last_page' => $industries->lastPage(),
                'total' => $industries->total(),
            ],
        ]);
    }

    public function store(StoreIndustryRequest $request): JsonResponse
    {
        $industry = Industry::create($request->validated());

        return response()->json(['industry' => $this->presentIndustry($industry)], 201);
    }

    public function update(UpdateIndustryRequest $request, Industry $industry): JsonResponse
    {
        $industry->update($request->validated());

        return response()->json(['industry' => $this->presentIndustry($industry)]);
    }

    public function destroy(Industry $industry): JsonResponse
    {
        $industry->delete();

        return response()->json(['message' => 'Industry deleted.']);
    }

    private function presentIndustry(Industry $industry): array
    {
        return [
            'id' => $industry->id,
            'name' => $industry->name,
        ];
    }
}
