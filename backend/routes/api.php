<?php

use App\Http\Controllers\Api\Admin\CasteController as AdminCasteController;
use App\Http\Controllers\Api\Admin\IndustryController as AdminIndustryController;
use App\Http\Controllers\Api\Admin\PermissionController;
use App\Http\Controllers\Api\Admin\QualificationController as AdminQualificationController;
use App\Http\Controllers\Api\Admin\RoleController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CasteController;
use App\Http\Controllers\Api\EducationLevelController;
use App\Http\Controllers\Api\IndustryController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\QualificationController;
use App\Http\Controllers\Api\ReligionController;
use Illuminate\Support\Facades\Route;

Route::get('states', [LocationController::class, 'states']);
Route::get('states/{state}/districts', [LocationController::class, 'districts']);
Route::get('religions', [ReligionController::class, 'index']);
Route::get('religions/{religion}/castes', [CasteController::class, 'index']);
Route::get('education-levels', [EducationLevelController::class, 'index']);
Route::get('education-levels/{educationLevel}/qualifications', [QualificationController::class, 'index']);
Route::get('industries', [IndustryController::class, 'index']);

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('refresh', [AuthController::class, 'refresh'])->middleware('throttle:login');

    Route::middleware('auth:api')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('logout-all', [AuthController::class, 'logoutAll']);
        Route::get('me', [AuthController::class, 'me']);
        Route::post('change-password', [AuthController::class, 'changePassword']);
    });
});

Route::prefix('admin')->middleware('auth:api')->group(function () {
    Route::get('permissions', [PermissionController::class, 'index'])
        ->middleware('permission:permissions.view');

    Route::middleware('permission:roles.view')->group(function () {
        Route::get('roles', [RoleController::class, 'index']);
        Route::get('roles/{role}', [RoleController::class, 'show']);
    });
    Route::post('roles', [RoleController::class, 'store'])->middleware('permission:roles.create');
    Route::put('roles/{role}', [RoleController::class, 'update'])->middleware('permission:roles.update');
    Route::delete('roles/{role}', [RoleController::class, 'destroy'])->middleware('permission:roles.delete');

    Route::get('users', [AdminUserController::class, 'index'])->middleware('permission:users.view');
    Route::put('users/{user}/roles', [AdminUserController::class, 'updateRoles'])
        ->middleware('permission:users.assign-roles');

    Route::get('castes', [AdminCasteController::class, 'index'])->middleware('permission:castes.view');
    Route::post('castes', [AdminCasteController::class, 'store'])->middleware('permission:castes.create');
    Route::put('castes/{caste}', [AdminCasteController::class, 'update'])->middleware('permission:castes.update');
    Route::delete('castes/{caste}', [AdminCasteController::class, 'destroy'])->middleware('permission:castes.delete');

    Route::get('qualifications', [AdminQualificationController::class, 'index'])
        ->middleware('permission:qualifications.view');
    Route::post('qualifications', [AdminQualificationController::class, 'store'])
        ->middleware('permission:qualifications.create');
    Route::put('qualifications/{qualification}', [AdminQualificationController::class, 'update'])
        ->middleware('permission:qualifications.update');
    Route::delete('qualifications/{qualification}', [AdminQualificationController::class, 'destroy'])
        ->middleware('permission:qualifications.delete');

    Route::get('industries', [AdminIndustryController::class, 'index'])
        ->middleware('permission:industries.view');
    Route::post('industries', [AdminIndustryController::class, 'store'])
        ->middleware('permission:industries.create');
    Route::put('industries/{industry}', [AdminIndustryController::class, 'update'])
        ->middleware('permission:industries.update');
    Route::delete('industries/{industry}', [AdminIndustryController::class, 'destroy'])
        ->middleware('permission:industries.delete');
});
