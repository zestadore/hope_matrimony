<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EducationLevel;
use Illuminate\Http\JsonResponse;

class QualificationController extends Controller
{
    public function index(EducationLevel $educationLevel): JsonResponse
    {
        return response()->json([
            'qualifications' => $educationLevel->qualifications()->orderBy('name')->get([
                'id', 'name', 'education_level_id',
            ]),
        ]);
    }
}
