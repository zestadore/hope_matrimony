<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EducationLevel;
use Illuminate\Http\JsonResponse;

class EducationLevelController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'education_levels' => EducationLevel::orderBy('sort_order')->get(['id', 'name']),
        ]);
    }
}
