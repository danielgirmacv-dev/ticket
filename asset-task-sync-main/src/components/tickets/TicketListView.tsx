import { MaintenanceTicket } from '@/integrations/laravel/client';
import { TicketListHeader, TicketListRow } from '@/components/tickets/TicketListRow';
import { cn } from '@/lib/utils';

import { AssignableTechnician } from '@/components/tickets/AssignTechnicianDialog';

interface TicketListViewProps {
  tickets: MaintenanceTicket[];
  onOpen: (ticket: MaintenanceTicket) => void;
  getTechnicians: (ticket: MaintenanceTicket) => AssignableTechnician[];
  onApproveAssign: (ticket: MaintenanceTicket) => void;
  className?: string;
}

export function TicketListView({
  tickets,
  onOpen,
  getTechnicians,
  onApproveAssign,
  className,
}: TicketListViewProps) {
  return (
    <div className={cn('rounded-xl border border-border/70 bg-card overflow-hidden shadow-sm', className)}>
      <TicketListHeader />
      {tickets.map((ticket, index) => (
        <TicketListRow
          key={ticket.id}
          ticket={ticket}
          index={index}
          onOpen={onOpen}
          technicians={getTechnicians(ticket)}
          onApproveAssign={onApproveAssign}
        />
      ))}
    </div>
  );
}
