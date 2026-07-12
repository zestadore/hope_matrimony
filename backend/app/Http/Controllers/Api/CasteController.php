<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Religion;
use Illuminate\Http\JsonResponse;

class CasteController extends Controller
{
    public function index(Religion $religion): JsonResponse
    {
        return response()->json([
            'castes' => $religion->castes()->orderBy('name')->get(['id', 'name', 'religion_id']),
        ]);
    }
}
