<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use App\Mail\AccountApproved;
use App\Models\User;

class TestEmail extends Command
{
    protected $signature = 'test:email {email}';
    protected $description = 'Send a test approval email';

    public function handle()
    {
        $email = $this->argument('email');

        $this->info('Sending test email to: ' . $email);

        try {
            // Create a dummy user object for testing
            $testUser = new User();
            $testUser->name = 'Test User';
            $testUser->email = $email;

            Mail::to($email)->queue(new AccountApproved($testUser));

            $this->info('✅ Email sent successfully!');
            $this->info('Check your inbox: ' . $email);

        } catch (\Exception $e) {
            $this->error('❌ Failed to send email: ' . $e->getMessage());
        }
    }
}
