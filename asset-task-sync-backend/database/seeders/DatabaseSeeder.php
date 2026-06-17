<?php

namespace Database\Seeders;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RolesAndPermissionsSeeder::class);

        $users = [
            ['name' => 'Admin User', 'email' => 'admin@example.com', 'role' => 'admin'],
            ['name' => 'Technician User', 'email' => 'technician@example.com', 'role' => 'technician'],
            ['name' => 'Requester User', 'email' => 'requester@example.com', 'role' => 'requester'],
        ];

        foreach ($users as $data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make('password'),
                'status' => 'active',
            ]);

            Profile::create([
                'user_id' => $user->id,
                'name' => $data['name'],
                'email' => $data['email'],
            ]);

            $user->assignRole($data['role']);
        }
    }
}
