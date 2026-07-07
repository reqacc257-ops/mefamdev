<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    public function applicantLogin(Request $request)
    {
        $username = trim((string) ($request->input('username') ?? ''));
        $password = (string) ($request->input('password') ?? '');

        if ($username === '' || $password === '') {
            return response()->json(['error' => 'Username and password are required'], 400);
        }

        $app = DB::table('applications')
            ->where('name', $username)
            ->first();

        if (!$app) {
            return response()->json(['error' => 'Application not found'], 404);
        }

        return response()->json([
            'ok' => true,
            'user' => [
                'type' => 'applicant',
                'name' => $app->name,
                'appId' => $app->id,
            ],
        ]);
    }
}
