<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class UserPasswordResetMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public User $user;
    public string $newPassword;
    public string $loginUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, string $newPassword)
    {
        $this->user = $user;
        $this->newPassword = $newPassword;
        $frontend = rtrim(env('FRONTEND_URL', 'https://it-support.eecproducts.com'), '/');
        if (empty($frontend) || str_contains($frontend, 'localhost') || str_contains($frontend, '127.0.0.1')) {
            $frontend = 'https://it-support.eecproducts.com';
        }
        $this->loginUrl = "{$frontend}/auth";
        $this->subject = 'Your EEC IT Account Password Has Been Updated';
    }

    /**
     * Build the message.
     */
    public function build(): self
    {
        return $this
            ->subject($this->subject)
            ->from(config('mail.from.address', 'itsupport@eecproducts.com'), config('mail.from.name', 'EEIG IT Service Desk'))
            ->html($this->buildHtml());
    }

    /**
     * Render the email HTML body.
     */
    protected function buildHtml(): string
    {
        $userName    = htmlspecialchars($this->user->name);
        $userEmail   = htmlspecialchars($this->user->email);
        $password    = htmlspecialchars($this->newPassword);
        $loginUrl    = htmlspecialchars($this->loginUrl);
        $appName     = config('app.name', 'Asset & Ticket Management System');
        $currentYear = date('Y');

        return "
        <!DOCTYPE html>
        <html lang='en'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Password Reset Notice</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    background-color: #f1f5f9;
                    margin: 0;
                    padding: 30px 15px;
                    color: #1e293b;
                }
                .container {
                    max-width: 580px;
                    margin: 0 auto;
                    background: #ffffff;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }
                .header {
                    background: linear-gradient(135deg, #0f5766 0%, #11adc4 100%);
                    color: #ffffff;
                    padding: 30px 24px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 22px;
                    font-weight: 700;
                    letter-spacing: -0.025em;
                }
                .header p {
                    margin: 6px 0 0;
                    font-size: 13px;
                    opacity: 0.9;
                }
                .content {
                    padding: 32px 28px;
                    font-size: 14px;
                    line-height: 1.65;
                }
                .greeting {
                    font-size: 16px;
                    font-weight: 600;
                    color: #0f172a;
                    margin-bottom: 14px;
                }
                .credentials-box {
                    background: #f8fafc;
                    border: 1px solid #cbd5e1;
                    border-left: 4px solid #11adc4;
                    border-radius: 8px;
                    padding: 18px 20px;
                    margin: 22px 0;
                }
                .cred-row {
                    display: flex;
                    margin-bottom: 10px;
                }
                .cred-row:last-child {
                    margin-bottom: 0;
                }
                .cred-label {
                    font-weight: 600;
                    color: #64748b;
                    width: 140px;
                    flex-shrink: 0;
                }
                .cred-value {
                    font-weight: 600;
                    color: #0f172a;
                    font-family: 'Courier New', Courier, monospace;
                    background: #e2e8f0;
                    padding: 2px 8px;
                    border-radius: 4px;
                    display: inline-block;
                }
                .btn-wrapper {
                    text-align: center;
                    margin: 28px 0;
                }
                .btn {
                    background: #11adc4;
                    background: linear-gradient(135deg, #11adc4 0%, #0f5766 100%);
                    color: #ffffff !important;
                    text-decoration: none;
                    padding: 12px 32px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 14px;
                    display: inline-block;
                    box-shadow: 0 2px 4px rgba(17, 173, 196, 0.25);
                }
                .alert-note {
                    background: #fffbeb;
                    border: 1px solid #fde68a;
                    border-radius: 8px;
                    padding: 14px 16px;
                    color: #92400e;
                    font-size: 12.5px;
                    margin-top: 20px;
                }
                .alert-note strong {
                    color: #78350f;
                }
                .footer {
                    background: #f8fafc;
                    border-top: 1px solid #f1f5f9;
                    padding: 20px 24px;
                    text-align: center;
                    font-size: 11.5px;
                    color: #94a3b8;
                }
                .footer p {
                    margin: 4px 0;
                }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>EEIG IT Service Desk</h1>
                    <p>{$appName}</p>
                </div>
                <div class='content'>
                    <div class='greeting'>Hello {$userName},</div>
                    <p>An administrator has reset your account password for the <strong>{$appName}</strong>.</p>
                    <p>Please use the updated login credentials below to sign in to your account, access maintenance tickets, and connect to company services:</p>

                    <div class='credentials-box'>
                        <div class='cred-row'>
                            <span class='cred-label'>Login Email:</span>
                            <span class='cred-value'>{$userEmail}</span>
                        </div>
                        <div class='cred-row'>
                            <span class='cred-label'>New Password:</span>
                            <span class='cred-value'>{$password}</span>
                        </div>
                    </div>

                    <div class='btn-wrapper'>
                        <a href='{$loginUrl}' class='btn' target='_blank'>Sign In with Given Password</a>
                    </div>

                    <div class='alert-note'>
                        <strong>Security Recommendation:</strong> For your security, please log in with this given password and change your password in your profile settings as soon as possible.
                    </div>

                    <p style='margin-top: 24px; font-size: 12.5px; color: #64748b;'>
                        If you did not request or expect this password update, please contact the IT Service Desk administrator immediately.
                    </p>
                </div>
                <div class='footer'>
                    <p>This is an automated administrative notification from {$appName}.</p>
                    <p>&copy; {$currentYear} EEIG Construction. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        ";
    }
}
