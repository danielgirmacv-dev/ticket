<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NewUserRegistrationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public User $newUser;
    public string $adminName;
    public string $usersUrl;

    public function __construct(User $newUser, string $adminName = 'Administrator')
    {
        $this->newUser = $newUser;
        $this->adminName = $adminName;
        $frontend = rtrim(env('FRONTEND_URL', 'https://it-support.eecproducts.com'), '/');
        if (empty($frontend) || str_contains($frontend, 'localhost') || str_contains($frontend, '127.0.0.1')) {
            $frontend = 'https://it-support.eecproducts.com';
        }
        $this->usersUrl = "{$frontend}/users";
        $this->subject = "New User Registration Awaiting Approval - {$newUser->name}";
    }

    public function build(): self
    {
        return $this
            ->subject($this->subject)
            ->from(config('mail.from.address', 'itsupport@eecproducts.com'), config('mail.from.name', 'EEIG IT Service Desk'))
            ->html($this->buildHtml());
    }

    protected function buildHtml(): string
    {
        $userName   = htmlspecialchars($this->newUser->name);
        $userEmail  = htmlspecialchars($this->newUser->email);
        $phone      = htmlspecialchars($this->newUser->profile?->phone ?? 'N/A');
        $department = htmlspecialchars($this->newUser->profile?->department ?? 'General');
        $registered = now()->format('M d, Y h:i A');

        return "
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; }
                .card { max-width: 600px; background: #ffffff; margin: 0 auto; border-radius: 8px; border: 1px solid #e2e8f4; overflow: hidden; }
                .header { background-color: #1AB1C7; color: #ffffff; padding: 20px; text-align: center; }
                .content { padding: 24px; color: #334155; line-height: 1.6; }
                .badge { background-color: #f59e0b; color: #ffffff; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 12px; }
                .table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 24px; }
                .table td { padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
                .label { font-weight: bold; color: #64748b; width: 140px; }
                .button-container { text-align: center; margin: 24px 0; }
                .btn { background-color: #1AB1C7; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block; }
                .footer { text-align: center; padding: 16px; background-color: #f8fafc; color: #94a3b8; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class='card'>
                <div class='header'>
                    <h2 style='margin:0;'>EEIG Construction - New User Registration</h2>
                </div>
                <div class='content'>
                    <p>Hello <strong>{$this->adminName}</strong>,</p>
                    <p>A new user has registered on the <strong>IT Maintenance Scheduler</strong> and is awaiting your review and approval:</p>

                    <table class='table'>
                        <tr><td class='label'>Name:</td><td><strong>{$userName}</strong></td></tr>
                        <tr><td class='label'>Email:</td><td>{$userEmail}</td></tr>
                        <tr><td class='label'>Department:</td><td>{$department}</td></tr>
                        <tr><td class='label'>Phone:</td><td>{$phone}</td></tr>
                        <tr><td class='label'>Registered Date:</td><td>{$registered}</td></tr>
                        <tr><td class='label'>Status:</td><td><span class='badge'>Pending Approval</span></td></tr>
                    </table>

                    <div class='button-container'>
                        <a href='{$this->usersUrl}' class='btn'>Review &amp; Approve User</a>
                    </div>
                </div>
                <div class='footer'>
                    This is an automated notification from the EEIG Construction IT Service Desk.
                </div>
            </div>
        </body>
        </html>
        ";
    }
}
