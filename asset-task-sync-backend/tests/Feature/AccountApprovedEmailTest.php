<?php

namespace Tests\Feature;

use App\Mail\AccountApproved;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AccountApprovedEmailTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'requester']);
    }

    public function test_account_approved_email_renders_professional_content(): void
    {
        $user = User::factory()->create([
            'name' => 'Abebe Kebede',
            'email' => 'abebe@example.com',
            'status' => 'active',
        ]);
        $user->assignRole('requester');

        Profile::create([
            'user_id' => $user->id,
            'name' => 'Abebe Kebede',
            'email' => 'abebe@example.com',
            'department' => 'Civil Engineering',
        ]);

        $mailable = new AccountApproved($user);
        $rendered = $mailable->render();

        $this->assertStringContainsString('EEIG IT Service Desk', $rendered);
        $this->assertStringContainsString('Abebe Kebede', $rendered);
        $this->assertStringContainsString('abebe@example.com', $rendered);
        $this->assertStringContainsString('Civil Engineering', $rendered);
        $this->assertStringContainsString('Sign In to Your Account', $rendered);
        $this->assertStringContainsString('Submit Work Orders', $rendered);
        $this->assertStringContainsString('https://it-support.eecproducts.com/auth', $rendered);
        $this->assertStringNotContainsString('localhost', $rendered);
    }
}
