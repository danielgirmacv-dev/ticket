<?php

namespace App\Jobs;

use App\Models\MaintenanceTicket;
use App\Services\MicrosoftGraphService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SendTicketApprovalNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public MaintenanceTicket $ticket;

    public function __construct(MaintenanceTicket $ticket)
    {
        $this->ticket = $ticket;
    }

    public function handle(MicrosoftGraphService $graphService): void
    {
        // Load ticket relationships safely
        $this->ticket->load(['requester.user', 'approvedBy.user', 'asset']);

        $recipientEmail = $this->ticket->requester?->user?->email;

        if (! $recipientEmail) {
            Log::warning("Skipping approval email for Ticket #{$this->ticket->id}: Requester has no valid email address.");
            return;
        }

        // Prevent Duplicate Email Notifications via Cache Lock
        $cacheKey = "ticket_approval_email_sent_{$this->ticket->id}";
        if (Cache::has($cacheKey)) {
            Log::info("Approval notification for Ticket #{$this->ticket->id} was already sent recently.");
            return;
        }

        $subject = "IT Ticket Approved - #{$this->ticket->id}";
        $htmlBody = $this->buildEmailHtml();

        try {
            $graphService->sendEmail($recipientEmail, $subject, $htmlBody);

            // Lock cache key for 24 hours to prevent duplicate triggers
            Cache::put($cacheKey, true, now()->addHours(24));

            Log::info("Ticket approval notification email successfully sent via Graph API to {$recipientEmail} for Ticket #{$this->ticket->id}");
        } catch (\Exception $e) {
            Log::error("Failed sending approval email for Ticket #{$this->ticket->id}: " . $e->getMessage());
            throw $e;
        }
    }

    protected function buildEmailHtml(): string
    {
        $ticketId     = htmlspecialchars($this->ticket->id);
        $title        = htmlspecialchars($this->ticket->title);
        $description  = htmlspecialchars($this->ticket->description ?? 'N/A');
        $requester    = htmlspecialchars($this->ticket->requester?->name ?? 'Requester');
        $approver     = htmlspecialchars($this->ticket->approvedBy?->name ?? 'System Administrator');
        $approvedAt   = $this->ticket->approved_at ? $this->ticket->approved_at->format('M d, Y h:i A') : now()->format('M d, Y h:i A');

        return "
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; }
                .card { max-width: 600px; background: #ffffff; margin: 0 auto; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
                .header { background-color: #1AB1C7; color: #ffffff; padding: 20px; text-align: center; }
                .content { padding: 24px; color: #334155; line-height: 1.6; }
                .badge { background-color: #22c55e; color: #ffffff; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 12px; }
                .table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                .table td { padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
                .label { font-weight: bold; color: #64748b; width: 140px; }
                .footer { text-align: center; padding: 16px; background-color: #f8fafc; color: #94a3b8; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class='card'>
                <div class='header'>
                    <h2 style='margin:0;'>EEIG Construction - IT Ticket Approved</h2>
                </div>
                <div class='content'>
                    <p>Hello <strong>{$requester}</strong>,</p>
                    <p>Your IT Support request has been reviewed and <span class='badge'>APPROVED</span>.</p>
                    
                    <table class='table'>
                        <tr><td class='label'>Ticket Number:</td><td>#{$ticketId}</td></tr>
                        <tr><td class='label'>Subject:</td><td>{$title}</td></tr>
                        <tr><td class='label'>Description:</td><td>{$description}</td></tr>
                        <tr><td class='label'>Approver:</td><td>{$approver}</td></tr>
                        <tr><td class='label'>Approved Date:</td><td>{$approvedAt}</td></tr>
                        <tr><td class='label'>Status:</td><td>Approved (Pending Assignment)</td></tr>
                    </table>

                    <p style='margin-top: 20px;'>A technician will be assigned shortly to assist you.</p>
                </div>
                <div class='footer'>
                    This is an automated notification from the EEIG Construction IT Service Desk. Please do not reply directly to this email.
                </div>
            </div>
        </body>
        </html>
        ";
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("SendTicketApprovalNotification Job failed permanently for Ticket #{$this->ticket->id}: {$exception->getMessage()}");
    }
}
