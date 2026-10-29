<?php

namespace Tests\Feature;

use App\Mail\UserPasswordResetMail;
use App\Models\Notification;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminPasswordResetTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'super_admin']);
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'technician']);
        Role::firstOrCreate(['name' => 'requester']);
    }

    public function test_super_admin_can_reset_user_password_and_trigger_notifications(): void
    {
        Mail::fake();

        $superAdmin = User::factory()->create([
            'name' => 'Super Admin',
            'email' => 'superadmin@example.com',
            'status' => 'active',
        ]);
        $superAdmin->assignRole('super_admin');
        Profile::create(['user_id' => $superAdmin->id, 'name' => 'Super Admin', 'email' => 'superadmin@example.com']);

        $targetUser = User::factory()->create([
            'name' => 'Target User',
            'email' => 'target@example.com',
            'password' => Hash::make('OldPassword123!'),
            'status' => 'active',
        ]);
        $targetUser->assignRole('technician');
        $profile = Profile::create([
            'user_id' => $targetUser->id,
            'name' => 'Target User',
            'email' => 'target@example.com',
            'phone' => '+251911223344',
        ]);

        $response = $this->actingAs($superAdmin)
            ->postJson("/api/users/{$targetUser->id}/reset-password", [
                'password' => 'NewSecurePassword2026!',
                'notify_user' => true,
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'email' => true,
                'sms' => true,
                'in_app' => true,
            ]);

        // Verify password was updated
        $this->assertTrue(Hash::check('NewSecurePassword2026!', $targetUser->fresh()->password));

        // Verify in-app notification was created
        $this->assertDatabaseHas('notifications', [
            'user_id' => $targetUser->id,
            'title' => 'Password Updated by Administrator',
        ]);

        // Verify email was queued/sent with new password
        Mail::assertQueued(UserPasswordResetMail::class, function ($mail) use ($targetUser) {
            return $mail->hasTo($targetUser->email) && $mail->newPassword === 'NewSecurePassword2026!';
        });
    }

    public function test_manager_cannot_reset_requester_password(): void
    {
        $manager = User::factory()->create(['status' => 'active']);
        $manager->assignRole('admin');
        Profile::create(['user_id' => $manager->id, 'name' => 'Manager', 'email' => $manager->email]);

        $requester = User::factory()->create(['status' => 'active']);
        $requester->assignRole('requester');
        Profile::create(['user_id' => $requester->id, 'name' => 'Requester', 'email' => $requester->email]);

        $response = $this->actingAs($manager)
            ->postJson("/api/users/{$requester->id}/reset-password", [
                'password' => 'NewPassword123!',
            ]);

        $response->assertStatus(403);
    }
}
