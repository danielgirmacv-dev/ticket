import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTickets } from '@/hooks/useTickets';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface StatusStyleConfig {
  label: string;
  badge: string;
  stripe: string;
  dot: string;
}

const statusStyles: Record<string, StatusStyleConfig> = {
  submitted: {
    label: 'Pending Approval',
    badge: 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/35 font-bold shadow-xs',
    stripe: 'border-l-4 border-l-amber-500',
    dot: 'bg-amber-500 animate-pulse',
  },
  pending: {
    label: 'Pending',
    badge: 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/35 font-bold shadow-xs',
    stripe: 'border-l-4 border-l-amber-500',
    dot: 'bg-amber-500 animate-pulse',
  },
  in_progress: {
    label: 'In Progress',
    badge: 'bg-[#11adc4]/20 text-[#074b58] dark:text-[#38d8ef] border border-[#11adc4]/40 font-bold shadow-xs',
    stripe: 'border-l-4 border-l-[#11adc4]',
    dot: 'bg-[#11adc4] animate-pulse',
  },
  completed: {
    label: 'Completed',
    badge: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/35 font-bold shadow-xs',
    stripe: 'border-l-4 border-l-emerald-500',
    dot: 'bg-emerald-500',
  },
  completed_pending_review: {
    label: 'Pending Review',
    badge: 'bg-[#0f5766]/20 text-[#0f5766] dark:text-[#7ce5f5] border border-[#0f5766]/40 font-bold shadow-xs',
    stripe: 'border-l-4 border-l-[#0f5766]',
    dot: 'bg-[#0f5766] animate-pulse',
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30 font-semibold',
    stripe: 'border-l-4 border-l-slate-400',
    dot: 'bg-slate-400',
  },
};

const priorityStyles: Record<string, string> = {
  low: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30 font-semibold',
  medium: 'bg-[#11adc4]/15 text-[#074b58] dark:text-[#38d8ef] border border-[#11adc4]/30 font-bold',
  high: 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/35 font-bold',
  critical: 'bg-rose-500/20 text-rose-800 dark:text-rose-200 border border-rose-500/40 font-black animate-pulse',
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
      <Card className="h-full border border-border/80 shadow-sm border-t-2 border-t-[#11adc4]">
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
    <Card className="h-full border border-border/80 shadow-xs border-t-2 border-t-[#11adc4] overflow-hidden">
      <CardHeader className="pb-3.5 flex flex-row items-center justify-between bg-muted/20 border-b border-border/40">
        <div>
          <CardTitle className="text-[18px] font-bold tracking-tight text-foreground flex items-center gap-2">
            Priority & Active Tickets
            <span className="flex h-2 w-2 rounded-full bg-[#11adc4] animate-ping" />
          </CardTitle>
          <p className="text-[13px] text-muted-foreground mt-0.5">Tickets requiring attention</p>
        </div>
        <Link to="/tickets">
          <Button variant="default" size="sm" className="h-8 px-3.5 text-xs font-semibold gap-1.5 shadow-sm">
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {activeTickets.length > 0 ? (
          activeTickets.map((ticket, index) => {
            const statusCfg = statusStyles[ticket.status] || {
              label: ticket.status.replace('_', ' '),
              badge: 'bg-muted text-muted-foreground border border-border font-semibold',
              stripe: 'border-l-4 border-l-muted-foreground',
              dot: 'bg-muted-foreground',
            };

            return (
              <div
                key={ticket.id}
                className={cn(
                  'group p-4 rounded-xl border border-border/70 bg-gradient-to-r from-card via-card to-muted/25 hover:to-[#11adc4]/5 hover:border-[#11adc4]/60 transition-all duration-200 cursor-pointer animate-slide-up shadow-2xs hover:shadow-md hover:-translate-y-0.5',
                  statusCfg.stripe
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={cn('status-badge text-[11px] font-bold uppercase tracking-wider', priorityStyles[ticket.priority])}>
                        {ticket.priority}
                      </span>
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px]', statusCfg.badge)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', statusCfg.dot)} />
                        {statusCfg.label}
                      </span>
                    </div>
                    <h4 className="font-bold text-[15px] sm:text-[16px] truncate group-hover:text-primary transition-colors text-foreground leading-snug">
                      {ticket.title}
                    </h4>
                    {ticket.asset?.name && (
                      <p className="text-[13px] sm:text-[14px] text-muted-foreground truncate mt-1">
                        Asset: <span className="font-medium text-foreground">{ticket.asset.name}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-[12px] sm:text-[13px] text-muted-foreground pt-2 border-t border-border/40">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span>{format(new Date(ticket.scheduled_date), 'MMM d, yyyy')}</span>
                  </div>
                  {ticket.estimated_duration && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      <span>{Math.floor(ticket.estimated_duration / 60)}h {ticket.estimated_duration % 60}m</span>
                    </div>
                  )}
                  {ticket.assigned_technician && (
                    <div className="ml-auto text-[12px] sm:text-[13px] truncate">
                      <span className="text-muted-foreground">Tech: </span>
                      <span className="font-semibold text-foreground">{ticket.assigned_technician.name}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
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
