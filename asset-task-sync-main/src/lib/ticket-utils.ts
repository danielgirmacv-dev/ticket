export function ticketReference(id: string): string {
  return `TKT-${id.slice(0, 8).toUpperCase()}`;
}

export const ticketPriorityStyles = {
  low: {
    label: 'Low',
    pill: 'bg-slate-100 text-slate-700 border-slate-200',
    stripe: 'border-l-slate-400',
    dot: 'bg-slate-400',
  },
  medium: {
    label: 'Medium',
    pill: 'bg-sky-50 text-sky-800 border-sky-200',
    stripe: 'border-l-sky-500',
    dot: 'bg-sky-500',
  },
  high: {
    label: 'High',
    pill: 'bg-amber-50 text-amber-900 border-amber-200',
    stripe: 'border-l-amber-500',
    dot: 'bg-amber-500',
  },
  critical: {
    label: 'Critical',
    pill: 'bg-rose-50 text-rose-800 border-rose-200',
    stripe: 'border-l-rose-500',
    dot: 'bg-rose-500',
  },
} as const;
