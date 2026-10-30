import { MaintenanceTicket } from '@/integrations/laravel/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge';
import { TicketWorkflow } from '@/components/tickets/TicketWorkflow';
import { ticketPriorityStyles, ticketReference } from '@/lib/ticket-utils';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  ArrowUpRight,
  Calendar,
  Clock,
  MapPin,
  Monitor,
  Paperclip,
  RefreshCw,
  Star,
} from 'lucide-react';

import { AssignableTechnician } from '@/components/tickets/AssignTechnicianDialog';

interface TicketCardProps {
  ticket: MaintenanceTicket;
  index?: number;
  onOpen: (ticket: MaintenanceTicket) => void;
  technicians: AssignableTechnician[];
  onApproveAssign: (ticket: MaintenanceTicket) => void;
}

function initials(name?: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function TicketCard({
  ticket,
  index = 0,
  onOpen,
  technicians,
  onApproveAssign,
}: TicketCardProps) {
  const priority = ticketPriorityStyles[ticket.priority] ?? ticketPriorityStyles.medium;

  return (
    <Card
      className={cn(
        'group overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm',
        'hover:shadow-md hover:border-primary/40 transition-all duration-200 cursor-pointer animate-slide-up',
        'border-l-[3px]',
        priority.stripe,
      )}
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={() => onOpen(ticket)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className="font-mono text-[10px] font-medium text-muted-foreground">
                {ticketReference(ticket.id)}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                  priority.pill,
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', priority.dot)} />
                {priority.label}
              </span>
              <TicketStatusBadge status={ticket.status} />
              {ticket.feedback_rating && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-200 shadow-2xs">
                  <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                  {ticket.feedback_rating}/5
                </span>
              )}
              {ticket.is_recurring && (
                <Badge variant="outline" className="text-[10px] h-5 gap-0.5 rounded-full px-1.5">
                  <RefreshCw className="h-2.5 w-2.5" />
                  Recurring
                </Badge>
              )}
              {(ticket.images?.attachments?.length ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-300">
                  <Paperclip className="h-2.5 w-2.5" />
                  {ticket.images!.attachments!.length}
                </span>
              )}
            </div>
            <h3 className="text-[15px] sm:text-[16px] font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors text-foreground">
              {ticket.title}
            </h3>
            {ticket.description ? (
              <p className="text-[14px] text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                {ticket.description}
              </p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-lg opacity-60 group-hover:opacity-100 group-hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(ticket);
            }}
          >
            <ArrowUpRight className="h-4 w-4 text-primary" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-muted-foreground mb-3">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-secondary" />
            {format(new Date(ticket.scheduled_date), 'MMM d, yyyy')}
          </span>
          {ticket.estimated_duration ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-secondary" />
              {Math.floor(ticket.estimated_duration / 60)}h {ticket.estimated_duration % 60}m
            </span>
          ) : null}
        </div>

        {ticket.asset ? (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-[13px]">
            <Monitor className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="font-medium truncate flex-1 text-foreground">{ticket.asset.name}</span>
            {ticket.asset.location ? (
              <span className="inline-flex items-center gap-1 text-muted-foreground truncate max-w-[45%]">
                <MapPin className="h-3 w-3 shrink-0" />
                {ticket.asset.location}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2 py-2 border-t border-border/50 text-[13px]">
          <div className="flex items-center gap-1.5 min-w-0">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[9px] bg-muted">{initials(ticket.requester?.name)}</AvatarFallback>
            </Avatar>
            <span className="truncate text-muted-foreground">{ticket.requester?.name || 'Unknown'}</span>
          </div>
          {ticket.assigned_technician ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-semibold">
                  {initials(ticket.assigned_technician.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate font-medium">{ticket.assigned_technician.name}</span>
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground italic shrink-0">Unassigned</span>
          )}
        </div>

        <div
          className="pt-2 mt-0.5 border-t border-border/40 [&:empty]:hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <TicketWorkflow
            ticket={ticket}
            technicians={technicians}
            showCancel={false}
            onApprove={() => onApproveAssign(ticket)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
