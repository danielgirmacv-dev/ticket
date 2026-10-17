import { cn } from '@/lib/utils';

interface TicketStatusBadgeProps {
  status: string;
  className?: string;
  showDot?: boolean;
}

const statusConfig: Record<string, { label: string; className: string; dotClass: string }> = {
  submitted: {
    label: 'Submitted',
    className: 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border-2 border-amber-500/40 font-bold shadow-2xs',
    dotClass: 'bg-amber-500 animate-pulse',
  },
  approved: {
    label: 'Approved',
    className: 'bg-teal-500/15 text-teal-800 dark:text-teal-200 border-2 border-teal-500/40 font-bold shadow-2xs',
    dotClass: 'bg-teal-500',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-rose-500/15 text-rose-800 dark:text-rose-200 border-2 border-rose-500/40 font-bold shadow-2xs',
    dotClass: 'bg-rose-500',
  },
  assigned: {
    label: 'Assigned',
    className: 'bg-[#0f5766]/15 text-[#0f5766] dark:text-[#7ce5f5] border-2 border-[#0f5766]/40 font-bold shadow-2xs',
    dotClass: 'bg-[#0f5766]',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-[#11adc4]/20 text-[#074b58] dark:text-[#38d8ef] border-2 border-[#11adc4]/50 font-bold shadow-2xs',
    dotClass: 'bg-[#11adc4] animate-pulse',
  },
  completed_pending_review: {
    label: 'Pending Review',
    className: 'bg-[#0f5766]/20 text-[#0f5766] dark:text-[#7ce5f5] border-2 border-[#0f5766]/45 font-bold shadow-2xs',
    dotClass: 'bg-[#0f5766] animate-pulse',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-2 border-emerald-500/40 font-bold shadow-2xs',
    dotClass: 'bg-emerald-500',
  },
  reopened: {
    label: 'Reopened',
    className: 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border-2 border-amber-500/50 font-bold shadow-2xs',
    dotClass: 'bg-amber-500 animate-ping',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-2 border-slate-500/30 font-semibold',
    dotClass: 'bg-slate-400',
  },
};

export function TicketStatusBadge({ status, className, showDot = true }: TicketStatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status.replace(/_/g, ' '),
    className: 'bg-muted text-muted-foreground border-border font-semibold',
    dotClass: 'bg-muted-foreground',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] tracking-tight transition-colors',
        config.className,
        className,
      )}
    >
      {showDot && <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', config.dotClass)} />}
      <span className="capitalize">{config.label}</span>
    </span>
  );
}
