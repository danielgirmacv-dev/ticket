export function ticketReference(id: string): string {
  return `TKT-${id.slice(0, 8).toUpperCase()}`;
}

export const ticketPriorityStyles = {
  low: {
    label: 'Low',
    pill: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    stripe: 'border-l-slate-400 dark:border-l-slate-600',
    dot: 'bg-slate-400',
  },
  medium: {
    label: 'Medium',
    pill: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/40',
    stripe: 'border-l-blue-500',
    dot: 'bg-blue-500',
  },
  high: {
    label: 'High',
    pill: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40',
    stripe: 'border-l-amber-500',
    dot: 'bg-amber-500',
  },
  critical: {
    label: 'Critical',
    pill: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40 font-semibold',
    stripe: 'border-l-rose-500',
    dot: 'bg-rose-500',
  },
} as const;
