<?php

namespace App\Mail;

use App\Models\MaintenanceTicket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TicketApprovalMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public MaintenanceTicket $ticket;
    public string $subject;
    public string $html;
    public string $role;

    public function __construct(MaintenanceTicket $ticket, string $subject, string $html, string $role)
    {
        $this->ticket = $ticket;
        $this->subject = $subject;
        $this->html = $html;
        $this->role = $role;
    }

    public function build(): self
    {
        return $this
            ->subject($this->subject)
            ->from(config('mail.from.address', 'itsupport@eecproducts.com'), config('mail.from.name', 'EEIG IT Service Desk'))
            ->html($this->html);
    }
}
