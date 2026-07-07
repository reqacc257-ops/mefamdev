<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\AuthController;

Route::get('/health', fn () => response()->json(['ok' => true]));
Route::get('/applications', [ApplicationController::class, 'index']);
Route::post('/public/apply', [ApplicationController::class, 'store']);
Route::get('/applications/{id}', [ApplicationController::class, 'show']);
Route::post('/auth/applicant', [AuthController::class, 'applicantLogin']);
