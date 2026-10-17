import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTickets } from '@/hooks/useTickets';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const statusStyles: Record<string, string> = {
  submitted: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  in_progress: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  completed_pending_review: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20',
  cancelled: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
};

const priorityStyles: Record<string, string> = {
  low: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  high: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
  critical: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-semibold',
};

const TicketsOverview = () => {
  const { data: tickets, isLoading } = useTickets();

  // Get upcoming and in-progress tickets — submitted/pending-review first, then newest
  const activeTickets = tickets
    ?.filter(ticket => ticket.status !== 'completed' && ticket.status !== 'cancelled')
    ?.sort((a, b) => {
      const order = (s: string) =>
        s === 'submitted' ? 0 : s === 'completed_pending_review' ? 1 : 2;
      const diff = order(a.status) - order(b.status);
      if (diff !== 0) return diff;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    })
    ?.slice(0, 5) || [];

  if (isLoading) {
    return (
      <Card className="h-full border border-border/80 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-7 w-20" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-border/60 space-y-2">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border border-border/80 shadow-xs">
      <CardHeader className="pb-3.5 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-[18px] font-semibold tracking-tight text-foreground">Priority & Active Tickets</CardTitle>
          <p className="text-[13px] text-muted-foreground mt-0.5">Tickets requiring attention</p>
        </div>
        <Link to="/tickets">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary font-semibold text-xs gap-1">
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeTickets.length > 0 ? (
          activeTickets.map((ticket, index) => (
            <div
              key={ticket.id}
              className={cn(
                'group p-4 rounded-xl border border-border/70 bg-card hover:bg-muted/30 transition-all duration-200 cursor-pointer animate-slide-up shadow-2xs'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={cn('status-badge', priorityStyles[ticket.priority])}>
                      {ticket.priority}
                    </span>
                    <span className={cn('status-badge', statusStyles[ticket.status])}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="font-semibold text-[15px] truncate group-hover:text-primary transition-colors text-foreground">
                    {ticket.title}
                  </h4>
                  {ticket.asset?.name && (
                    <p className="text-[14px] text-muted-foreground truncate mt-1">
                      {ticket.asset.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2.5 text-[13px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{format(new Date(ticket.scheduled_date), 'MMM d, yyyy')}</span>
                </div>
                {ticket.estimated_duration && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{Math.floor(ticket.estimated_duration / 60)}h {ticket.estimated_duration % 60}m</span>
                  </div>
                )}
              </div>
              {ticket.assigned_technician && (
                <div className="mt-2 text-[13px]">
                  <span className="text-muted-foreground">Assigned to: </span>
                  <span className="font-medium text-foreground">{ticket.assigned_technician.name}</span>
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
