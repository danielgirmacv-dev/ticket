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
            ['name' => 'Super Admin User', 'email' => 'superadmin@example.com', 'role' => 'super_admin', 'department' => 'Administration'],
            ['name' => 'IT Support Manager', 'email' => 'it_support_manager@example.com', 'role' => 'admin', 'department' => 'IT Support'],
            ['name' => 'IT SAP Deployment Manager', 'email' => 'sap_manager@example.com', 'role' => 'admin', 'department' => 'SAP Deployment'],
            ['name' => 'Admin User', 'email' => 'admin@example.com', 'role' => 'admin', 'department' => 'General Management'],
            ['name' => 'Technician User', 'email' => 'technician@example.com', 'role' => 'technician', 'department' => 'Maintenance'],
            ['name' => 'Requester User', 'email' => 'requester@example.com', 'role' => 'requester', 'department' => 'Finance'],
        ];

        foreach ($users as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => Hash::make('password'),
                    'status' => 'active',
                ]
            );

            Profile::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'department' => $data['department'],
                ]
            );

            $user->syncRoles([$data['role']]);
        }

        $this->call(FaqSeeder::class);
    }
}
