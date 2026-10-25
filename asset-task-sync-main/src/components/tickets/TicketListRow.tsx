import { MaintenanceTicket } from '@/integrations/laravel/client';
import { Button } from '@/components/ui/button';
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge';
import { TicketWorkflow } from '@/components/tickets/TicketWorkflow';
import { ticketPriorityStyles, ticketReference } from '@/lib/ticket-utils';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowUpRight, Paperclip, Star } from 'lucide-react';

interface TicketListRowProps {
  ticket: MaintenanceTicket;
  index?: number;
  onOpen: (ticket: MaintenanceTicket) => void;
  technicians: Array<{ id: string; name: string }>;
  onApproveAssign: (ticket: MaintenanceTicket) => void;
}

export function TicketListRow({
  ticket,
  index = 0,
  onOpen,
  technicians,
  onApproveAssign,
}: TicketListRowProps) {
  const priority = ticketPriorityStyles[ticket.priority] ?? ticketPriorityStyles.medium;

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'group grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-3 items-center px-3 py-3 sm:px-4',
        'border-b border-border/50 last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer animate-slide-up',
        'border-l-[3px]',
        priority.stripe,
      )}
      style={{ animationDelay: `${index * 25}ms` }}
      onClick={() => onOpen(ticket)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(ticket);
        }
      }}
    >
      <div className="lg:col-span-2 flex flex-wrap items-center gap-1.5 min-w-0">
        <span className="font-mono text-xs font-semibold text-muted-foreground">
          {ticketReference(ticket.id)}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold lg:hidden',
            priority.pill,
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', priority.dot)} />
          {priority.label}
        </span>
      </div>

      <div className="lg:col-span-3 min-w-0">
        <p className="text-[15px] font-semibold truncate group-hover:text-primary transition-colors text-foreground">{ticket.title}</p>
        <p className="text-[13px] text-muted-foreground truncate lg:hidden mt-0.5">
          {format(new Date(ticket.scheduled_date), 'MMM d, yyyy')}
          {ticket.asset?.name ? ` · ${ticket.asset.name}` : ''}
        </p>
      </div>

      <div className="hidden lg:flex lg:col-span-2 items-center gap-1.5">
        <TicketStatusBadge status={ticket.status} />
        {ticket.feedback_rating && (
          <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-200 shadow-2xs shrink-0">
            <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
            {ticket.feedback_rating}/5
          </span>
        )}
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
            priority.pill,
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', priority.dot)} />
          {priority.label}
        </span>
        {(ticket.images?.attachments?.length ?? 0) > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/40 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-300 shrink-0">
            <Paperclip className="h-2.5 w-2.5" />
            {ticket.images!.attachments!.length}
          </span>
        )}
      </div>

      <div className="hidden lg:block lg:col-span-2 text-[14px] text-muted-foreground truncate">
        {format(new Date(ticket.scheduled_date), 'MMM d, yyyy')}
      </div>

      <div className="hidden lg:block lg:col-span-2 text-[14px] truncate">
        <span className="text-muted-foreground">{ticket.requester?.name || '—'}</span>
        <span className="text-muted-foreground/50 mx-1">→</span>
        <span className="font-medium text-foreground">{ticket.assigned_technician?.name || 'Unassigned'}</span>
      </div>

      <div
        className="lg:col-span-1 flex items-center justify-end gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hidden xl:block [&:empty]:hidden max-w-[12rem] overflow-hidden">
          <TicketWorkflow
            ticket={ticket}
            technicians={technicians}
            showCancel={false}
            onApprove={() => onApproveAssign(ticket)}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-lg group-hover:bg-primary/10"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(ticket);
          }}
        >
          <ArrowUpRight className="h-4 w-4 text-primary" />
        </Button>
      </div>

      <div className="flex lg:hidden flex-wrap items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
        <TicketStatusBadge status={ticket.status} className="text-[10px]" />
        <div className="flex-1 min-w-0 [&:empty]:hidden">
          <TicketWorkflow
            ticket={ticket}
            technicians={technicians}
            showCancel={false}
            onApprove={() => onApproveAssign(ticket)}
          />
        </div>
      </div>
    </div>
  );
}

export function TicketListHeader() {
  return (
    <div className="hidden lg:grid grid-cols-12 gap-3 px-4 py-3 bg-muted/40 border-b border-border text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
      <div className="col-span-2">Reference</div>
      <div className="col-span-3">Title</div>
      <div className="col-span-2">Status</div>
      <div className="col-span-2">Scheduled</div>
      <div className="col-span-2">People</div>
      <div className="col-span-1 text-right">Open</div>
    </div>
  );
}
