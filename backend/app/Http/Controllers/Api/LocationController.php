<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\State;
use Illuminate\Http\JsonResponse;

class LocationController extends Controller
{
    public function states(): JsonResponse
    {
        return response()->json([
            'states' => State::orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    public function districts(State $state): JsonResponse
    {
        return response()->json([
            'districts' => $state->districts()->orderBy('name')->get(['id', 'name', 'state_id']),
        ]);
    }
}
