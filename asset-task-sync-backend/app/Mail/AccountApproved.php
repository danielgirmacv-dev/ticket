<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AccountApproved extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public User $user;
    public string $loginUrl;
    public string $telegramBotUsername;
    public string $telegramBotLink;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user)
    {
        $this->user = $user;
        $frontend = rtrim(env('FRONTEND_URL', env('APP_URL', 'http://localhost:8080')), '/');
        $this->loginUrl = "{$frontend}/auth";
        $this->telegramBotUsername = env('TELEGRAM_BOT_USERNAME', 'eec_it_bot');
        $this->telegramBotLink = "https://t.me/{$this->telegramBotUsername}?start";
        $this->subject = '🎉 Your EEIG IT Account Has Been Approved - Access Granted';
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🎉 Your EEIG IT Account Has Been Approved - Access Granted',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            htmlString: $this->buildHtml(),
        );
    }

    /**
     * Build the message for standard/legacy mailable sending.
     */
    public function build(): self
    {
        return $this
            ->subject($this->subject)
            ->from(config('mail.from.address', 'itsupport@eecproducts.com'), config('mail.from.name', 'EEIG IT Service Desk'))
            ->html($this->buildHtml());
    }

    /**
     * Build the professional HTML email body.
     */
    protected function buildHtml(): string
    {
        $this->user->loadMissing(['profile.location', 'roles']);

        $userName    = htmlspecialchars($this->user->name ?? 'User');
        $userEmail   = htmlspecialchars($this->user->email ?? '');
        $department  = htmlspecialchars($this->user->profile?->department ?? 'General Operations');
        $location    = htmlspecialchars($this->user->profile?->location?->name ?? 'Head Office');
        $loginUrl    = htmlspecialchars($this->loginUrl);
        $appName     = config('app.name', 'Asset & Ticket Management System');
        $currentYear = date('Y');
        $supportEmail = config('mail.from.address', 'itsupport@eecproducts.com');
        $botUsername  = htmlspecialchars($this->telegramBotUsername);
        $botLink      = htmlspecialchars($this->telegramBotLink);

        // Friendly role label
        $rawRole = $this->user->roles->first()?->name ?? 'requester';
        $roleName = match ($rawRole) {
            'super_admin' => 'Super Administrator',
            'admin'       => 'Department Operations Manager',
            'technician'  => 'Technical Specialist',
            default       => 'Corporate Staff / Requester',
        };

        return "
        <!DOCTYPE html>
        <html lang='en'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Account Approved</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    background-color: #f1f5f9;
                    margin: 0;
                    padding: 30px 15px;
                    color: #1e293b;
                    -webkit-font-smoothing: antialiased;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: #ffffff;
                    border-radius: 14px;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
                }
                .header {
                    background: linear-gradient(135deg, #0f5766 0%, #11adc4 100%);
                    color: #ffffff;
                    padding: 36px 30px;
                    text-align: center;
                }
                .header-badge {
                    display: inline-block;
                    background: rgba(255, 255, 255, 0.18);
                    border: 1px solid rgba(255, 255, 255, 0.35);
                    border-radius: 20px;
                    padding: 4px 14px;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    margin-bottom: 12px;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 700;
                    letter-spacing: -0.025em;
                }
                .header p {
                    margin: 8px 0 0;
                    font-size: 13.5px;
                    opacity: 0.92;
                }
                .content {
                    padding: 34px 30px;
                    font-size: 14px;
                    line-height: 1.65;
                }
                .greeting {
                    font-size: 17px;
                    font-weight: 700;
                    color: #0f172a;
                    margin-bottom: 12px;
                }
                .intro-text {
                    font-size: 14.5px;
                    color: #334155;
                    margin-bottom: 24px;
                }
                .status-card {
                    background: #f8fafc;
                    border: 1px solid #cbd5e1;
                    border-left: 4px solid #10b981;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 22px 0 28px 0;
                }
                .status-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 14px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .status-title {
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #475569;
                }
                .badge-active {
                    background: #dcfce7;
                    color: #15803d;
                    border: 1px solid #86efac;
                    padding: 3px 10px;
                    border-radius: 9999px;
                    font-size: 11.5px;
                    font-weight: 700;
                }
                .info-row {
                    margin-bottom: 8px;
                    font-size: 13px;
                }
                .info-row:last-child {
                    margin-bottom: 0;
                }
                .info-label {
                    font-weight: 600;
                    color: #64748b;
                    display: inline-block;
                    width: 130px;
                }
                .info-value {
                    font-weight: 600;
                    color: #0f172a;
                }
                .section-title {
                    font-size: 13px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: #475569;
                    margin: 28px 0 14px 0;
                }
                .feature-list {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    padding: 16px 20px;
                    margin-bottom: 28px;
                }
                .feature-item {
                    display: flex;
                    align-items: flex-start;
                    margin-bottom: 12px;
                    font-size: 13px;
                    color: #334155;
                }
                .feature-item:last-child {
                    margin-bottom: 0;
                }
                .feature-icon {
                    margin-right: 12px;
                    font-size: 16px;
                    line-height: 1.3;
                }
                .btn-container {
                    text-align: center;
                    margin: 32px 0;
                }
                .btn-primary {
                    background: #11adc4;
                    background: linear-gradient(135deg, #11adc4 0%, #0f5766 100%);
                    color: #ffffff !important;
                    text-decoration: none;
                    padding: 14px 38px;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 14.5px;
                    display: inline-block;
                    letter-spacing: -0.01em;
                    box-shadow: 0 4px 10px rgba(17, 173, 196, 0.35);
                }
                .tip-box {
                    background: #eff6ff;
                    border: 1px solid #bfdbfe;
                    border-radius: 10px;
                    padding: 16px 18px;
                    color: #1e40af;
                    font-size: 12.5px;
                    margin-bottom: 24px;
                    line-height: 1.55;
                }
                .tip-box strong {
                    color: #1e3a8a;
                }
                .tip-box a {
                    color: #2563eb;
                    font-weight: 600;
                    text-decoration: underline;
                }
                .security-note {
                    font-size: 12.5px;
                    color: #64748b;
                    line-height: 1.5;
                    border-top: 1px solid #f1f5f9;
                    padding-top: 18px;
                }
                .footer {
                    background: #f8fafc;
                    border-top: 1px solid #e2e8f0;
                    padding: 24px 30px;
                    text-align: center;
                    font-size: 11.5px;
                    color: #94a3b8;
                    line-height: 1.6;
                }
                .footer a {
                    color: #64748b;
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <div class='header-badge'>Access Verified &amp; Granted</div>
                    <h1>EEIG IT Service Desk</h1>
                    <p>{$appName}</p>
                </div>

                <div class='content'>
                    <div class='greeting'>Hello {$userName},</div>
                    <p class='intro-text'>
                        Great news! Your account registration for the <strong>{$appName}</strong> has been officially verified and approved by the system administrator. Your access is now live.
                    </p>

                    <!-- Account Profile Summary -->
                    <div class='status-card'>
                        <div class='status-header'>
                            <span class='status-title'>Account Credentials &amp; Profile</span>
                            <span class='badge-active'>● Active &amp; Ready</span>
                        </div>
                        <div class='info-row'>
                            <span class='info-label'>Full Name:</span>
                            <span class='info-value'>{$userName}</span>
                        </div>
                        <div class='info-row'>
                            <span class='info-label'>Login Email:</span>
                            <span class='info-value'>{$userEmail}</span>
                        </div>
                        <div class='info-row'>
                            <span class='info-label'>Assigned Role:</span>
                            <span class='info-value'>{$roleName}</span>
                        </div>
                        <div class='info-row'>
                            <span class='info-label'>Department:</span>
                            <span class='info-value'>{$department}</span>
                        </div>
                        <div class='info-row'>
                            <span class='info-label'>Location:</span>
                            <span class='info-value'>{$location}</span>
                        </div>
                    </div>

                    <!-- What you can do -->
                    <div class='section-title'>What you can do right now:</div>
                    <div class='feature-list'>
                        <div class='feature-item'>
                            <span class='feature-icon'>📋</span>
                            <div><strong>Submit Work Orders &amp; Tickets:</strong> Request assistance for computer hardware, software installations, SAP/ERP workflows, and facility repairs.</div>
                        </div>
                        <div class='feature-item'>
                            <span class='feature-icon'>⚡</span>
                            <div><strong>Live Tracking &amp; Transparency:</strong> Monitor ticket status in real-time, view assigned technicians, and track resolution timelines.</div>
                        </div>
                        <div class='feature-item'>
                            <span class='feature-icon'>💻</span>
                            <div><strong>Equipment &amp; Assets:</strong> Oversee IT equipment and hardware tagged to your department and office location.</div>
                        </div>
                        <div class='feature-item'>
                            <span class='feature-icon'>🔔</span>
                            <div><strong>Instant Status Alerts:</strong> Stay informed at every step via Email, SMS alerts, and in-app notifications.</div>
                        </div>
                    </div>

                    <!-- Call to action button -->
                    <div class='btn-container'>
                        <a href='{$loginUrl}' class='btn-primary' target='_blank'>Sign In to Your Account</a>
                    </div>

                    <!-- Telegram Integration Pro Tip -->
                    <div class='tip-box'>
                        <strong>💡 Mobile Alerts via Telegram:</strong> You can link your account with our official Telegram bot (<a href='{$botLink}' target='_blank'>@{$botUsername}</a>) to receive instant notifications and status updates right on your smartphone.
                    </div>

                    <div class='security-note'>
                        <p style='margin:0 0 6px 0;'>
                            <strong>Next Steps:</strong> Use your registered email address and the password you selected at sign-up to log in.
                        </p>
                        <p style='margin:0;'>
                            If you encounter any issues accessing your account or have questions, please reach out to the IT Support Desk at <a href='mailto:{$supportEmail}' style='color:#0f5766; font-weight:600;'>{$supportEmail}</a>.
                        </p>
                    </div>
                </div>

                <div class='footer'>
                    <p style='margin:0 0 4px 0;'>This is an official administrative notification from the EEIG Construction IT Service Desk.</p>
                    <p style='margin:0;'>&copy; {$currentYear} EEIG Construction. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        ";
    }
}
