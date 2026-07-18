<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Uses firstOrCreate so this is safe to run multiple times.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions (idempotent - safe to re-run)
        Permission::firstOrCreate(['name' => 'manage assets']);
        Permission::firstOrCreate(['name' => 'view assets']);
        Permission::firstOrCreate(['name' => 'manage tickets']);
        Permission::firstOrCreate(['name' => 'view tickets']);
        Permission::firstOrCreate(['name' => 'manage users']);

        $allPermissions = Permission::all();

        // Create roles and sync permissions (idempotent)
        $requester = Role::firstOrCreate(['name' => 'requester']);
        $requester->syncPermissions(['view assets', 'view tickets']);

        $technician = Role::firstOrCreate(['name' => 'technician']);
        $technician->syncPermissions(['view assets', 'manage tickets', 'view tickets']);

        // admin = Manager role: reviews/approves requester tickets, assigns technicians
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->syncPermissions($allPermissions);

        // super_admin = highest authority: manages managers, full system access
        $superAdmin = Role::firstOrCreate(['name' => 'super_admin']);
        $superAdmin->syncPermissions($allPermissions);
    }
}
