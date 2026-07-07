<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApplicationController extends Controller
{
    public function index()
    {
        return response()->json(DB::table('applications')->get());
    }

    public function show($id)
    {
        $app = DB::table('applications')->find($id);

        return $app
            ? response()->json($app)
            : response()->json(['error' => 'Not found'], 404);
    }

    public function store(Request $request)
    {
        $data = $request->all();

        $id = DB::table('applications')->insertGetId([
            'name' => $data['name'] ?? '',
            'sy' => $data['sy'] ?? '',
            'status' => 'Pending Review',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['ok' => true, 'id' => $id]);
    }
}
