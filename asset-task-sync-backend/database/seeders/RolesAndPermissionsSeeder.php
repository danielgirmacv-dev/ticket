<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // create permissions
        Permission::create(['name' => 'manage assets']);
        Permission::create(['name' => 'view assets']);
        Permission::create(['name' => 'manage tickets']);
        Permission::create(['name' => 'view tickets']);
        Permission::create(['name' => 'manage users']);

        // create roles and assign created permissions

        // this can be done as separate statements
        $role = Role::create(['name' => 'requester']);
        $role->givePermissionTo(['view assets', 'view tickets']);

        $role = Role::create(['name' => 'technician']);
        $role->givePermissionTo(['view assets', 'manage tickets', 'view tickets']);

        $role = Role::create(['name' => 'admin']);
        $role->givePermissionTo(Permission::all());
    }
}
