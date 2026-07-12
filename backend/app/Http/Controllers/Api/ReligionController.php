<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Religion;
use Illuminate\Http\JsonResponse;

class ReligionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'religions' => Religion::orderBy('name')->get(['id', 'name']),
        ]);
    }
}
