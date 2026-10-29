<?php

namespace App\Mail;

use App\Models\MaintenanceTicket;
use App\Models\Profile;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TicketAssignedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public MaintenanceTicket $ticket;
    public Profile $technician;
    public string $ticketUrl;

    public function __construct(MaintenanceTicket $ticket, Profile $technician)
    {
        $this->ticket = $ticket;
        $this->technician = $technician;
        $frontend = rtrim(env('FRONTEND_URL', 'https://it-support.eecproducts.com'), '/');
        if (empty($frontend) || str_contains($frontend, 'localhost') || str_contains($frontend, '127.0.0.1')) {
            $frontend = 'https://it-support.eecproducts.com';
        }
        $this->ticketUrl = "{$frontend}/tickets/{$ticket->id}";
        $this->subject = "New Ticket Assigned to You - #{$ticket->id}: {$ticket->title}";
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
        $ticketId    = htmlspecialchars($this->ticket->id);
        $title       = htmlspecialchars($this->ticket->title);
        $description = htmlspecialchars($this->ticket->description ?? 'N/A');
        $techName    = htmlspecialchars($this->technician->name ?? 'Technician');
        $requester   = htmlspecialchars($this->ticket->requester?->user?->name ?? $this->ticket->requester?->name ?? 'Requester');
        $category    = htmlspecialchars(strtoupper(str_replace('_', ' ', $this->ticket->support_category ?? 'General')));
        $priority    = htmlspecialchars(strtoupper($this->ticket->priority ?? 'Medium'));
        $scheduled   = htmlspecialchars($this->ticket->scheduled_date ? $this->ticket->scheduled_date->format('M d, Y h:i A') : 'Immediate / Pending schedule');
        $asset       = htmlspecialchars($this->ticket->asset?->name ?? 'N/A');

        $priorityColor = match (strtolower($this->ticket->priority ?? 'medium')) {
            'urgent', 'critical' => '#ef4444',
            'high' => '#f97316',
            'medium' => '#eab308',
            default => '#3b82f6',
        };

        return "
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; }
                .card { max-width: 600px; background: #ffffff; margin: 0 auto; border-radius: 8px; border: 1px solid #e2e8f4; overflow: hidden; }
                .header { background-color: #1AB1C7; color: #ffffff; padding: 20px; text-align: center; }
                .content { padding: 24px; color: #334155; line-height: 1.6; }
                .badge { background-color: {$priorityColor}; color: #ffffff; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 12px; }
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
                    <h2 style='margin:0;'>EEIG Construction - Ticket Assigned</h2>
                </div>
                <div class='content'>
                    <p>Hello <strong>{$techName}</strong>,</p>
                    <p>A new maintenance ticket has been assigned to you. Please review the details below and log in to start working:</p>

                    <table class='table'>
                        <tr><td class='label'>Ticket Number:</td><td><strong>#{$ticketId}</strong></td></tr>
                        <tr><td class='label'>Subject:</td><td>{$title}</td></tr>
                        <tr><td class='label'>Requester:</td><td>{$requester}</td></tr>
                        <tr><td class='label'>Category:</td><td>{$category}</td></tr>
                        <tr><td class='label'>Priority:</td><td><span class='badge'>{$priority}</span></td></tr>
                        <tr><td class='label'>Asset:</td><td>{$asset}</td></tr>
                        <tr><td class='label'>Scheduled Date:</td><td>{$scheduled}</td></tr>
                        <tr><td class='label'>Description:</td><td>{$description}</td></tr>
                    </table>

                    <div class='button-container'>
                        <a href='{$this->ticketUrl}' class='btn'>Open Ticket &amp; Start Working</a>
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
