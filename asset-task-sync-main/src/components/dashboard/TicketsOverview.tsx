import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTickets } from '@/hooks/useTickets';
import { Calendar, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const statusStyles = {
  pending: 'status-pending',
  in_progress: 'status-in-progress',
  completed: 'status-completed',
  cancelled: 'bg-muted text-muted-foreground',
};

const priorityStyles = {
  low: 'priority-low',
  medium: 'priority-medium',
  high: 'priority-high',
  critical: 'bg-destructive/10 text-destructive font-semibold',
};

const TicketsOverview = () => {
  const { data: tickets, isLoading } = useTickets();

  // Get upcoming and in-progress tickets
  const activeTickets = tickets
    ?.filter(ticket => ticket.status !== 'completed' && ticket.status !== 'cancelled')
    .slice(0, 5) || [];

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Upcoming Tickets</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Upcoming Tickets</CardTitle>
        <Link to="/tickets">
          <Button variant="ghost" size="sm" className="text-accent hover:text-accent">
            View all
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeTickets.length > 0 ? (
          activeTickets.map((ticket, index) => (
            <div
              key={ticket.id}
              className={cn(
                'group p-4 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-all duration-200 cursor-pointer animate-slide-up'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('status-badge', priorityStyles[ticket.priority])}>
                      {ticket.priority}
                    </span>
                    <span className={cn('status-badge', statusStyles[ticket.status])}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="font-medium text-sm truncate group-hover:text-accent transition-colors">
                    {ticket.title}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {ticket.asset?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(ticket.scheduled_date), 'MMM d, yyyy')}</span>
                </div>
                {ticket.estimated_duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{Math.floor(ticket.estimated_duration / 60)}h {ticket.estimated_duration % 60}m</span>
                  </div>
                )}
              </div>
              {ticket.assigned_technician && (
                <div className="mt-2 text-xs">
                  <span className="text-muted-foreground">Assigned to: </span>
                  <span className="font-medium">{ticket.assigned_technician.name}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No upcoming tickets found.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TicketsOverview;
