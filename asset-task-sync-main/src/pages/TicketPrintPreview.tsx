import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IctServiceRequestForm } from '@/components/tickets/IctServiceRequestForm';
import { useTicket } from '@/hooks/useTickets';
import { ticketReference } from '@/lib/ticket-utils';
import { ICT_FORM_META } from '@/lib/ict-request-form';

const TicketPrintPreview = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { data: ticket, isLoading, isError } = useTicket(ticketId);

  useEffect(() => {
    if (!ticket) return;
    const previousTitle = document.title;
    document.title = `${ICT_FORM_META.title} — ${ticketReference(ticket.id)}`;
    return () => {
      document.title = previousTitle;
    };
  }, [ticket]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="ict-form-page">
        <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading ICT service form…
        </div>
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="ict-form-page">
        <div className="ict-form-toolbar">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Ticket
          </Button>
        </div>
        <div className="ict-form-notice">
          This ticket could not be loaded. You may not have permission to view it, or it no longer exists.
        </div>
      </div>
    );
  }

  const isCompleted = ticket.status === 'completed';

  return (
    <div className="ict-form-page">
      <div className="ict-form-toolbar print-hidden no-print">
        <Button variant="outline" asChild>
          <Link to={`/tickets/${ticket.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Ticket
          </Link>
        </Button>
        <div className="ict-form-toolbar-actions">
          <Button onClick={handlePrint} disabled={!isCompleted}>
            <Printer className="h-4 w-4 mr-2" />
            Print Form
          </Button>
          <Button variant="secondary" onClick={handlePrint} disabled={!isCompleted}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <p className="text-xs text-muted-foreground w-full sm:w-auto">
            Print Form opens the browser print dialog. Choose a printer, or select Save as PDF.
          </p>
        </div>
      </div>

      {!isCompleted && (
        <div className="ict-form-notice print-hidden no-print">
          This ticket is not completed. The official ICT Service &amp; Requisition Request Form is available as a
          finalized completion report only after the ticket status is Completed.
        </div>
      )}

      {isCompleted && (
        <IctServiceRequestForm ticket={ticket} />
      )}
    </div>
  );
};

export default TicketPrintPreview;
