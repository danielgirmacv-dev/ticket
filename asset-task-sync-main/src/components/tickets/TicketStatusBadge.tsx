import { cn } from '@/lib/utils';

interface TicketStatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  submitted: { label: 'Submitted', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  approved: { label: 'Approved', className: 'bg-teal-50 text-teal-800 border-teal-200' },
  rejected: { label: 'Rejected', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  assigned: { label: 'Assigned', className: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  in_progress: { label: 'In progress', className: 'bg-sky-50 text-sky-800 border-sky-200' },
  completed_pending_review: { label: 'Pending review', className: 'bg-violet-50 text-violet-800 border-violet-200' },
  completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  reopened: { label: 'Reopened', className: 'bg-orange-50 text-orange-800 border-orange-200' },
  cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground border-border' },
};

export function TicketStatusBadge({ status, className }: TicketStatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status.replace(/_/g, ' '),
    className: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
