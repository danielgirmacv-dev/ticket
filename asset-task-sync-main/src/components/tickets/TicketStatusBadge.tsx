import { cn } from '@/lib/utils';

interface TicketStatusBadgeProps {
  status: string;
  className?: string;
  showDot?: boolean;
}

const statusConfig: Record<string, { label: string; className: string; dotClass: string }> = {
  submitted: {
    label: 'Submitted',
    className: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
    dotClass: 'bg-amber-500',
  },
  approved: {
    label: 'Approved',
    className: 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800/60',
    dotClass: 'bg-teal-500',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60',
    dotClass: 'bg-rose-500',
  },
  assigned: {
    label: 'Assigned',
    className: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60',
    dotClass: 'bg-blue-500',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60',
    dotClass: 'bg-blue-500',
  },
  completed_pending_review: {
    label: 'Pending Review',
    className: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
    dotClass: 'bg-amber-500',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
    dotClass: 'bg-emerald-500',
  },
  reopened: {
    label: 'Reopened',
    className: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700/60',
    dotClass: 'bg-amber-500 animate-pulse',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700',
    dotClass: 'bg-slate-400',
  },
};

export function TicketStatusBadge({ status, className, showDot = true }: TicketStatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status.replace(/_/g, ' '),
    className: 'bg-muted text-muted-foreground border-border',
    dotClass: 'bg-muted-foreground',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-tight transition-colors',
        config.className,
        className,
      )}
    >
      {showDot && <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', config.dotClass)} />}
      <span className="capitalize">{config.label}</span>
    </span>
  );
}
