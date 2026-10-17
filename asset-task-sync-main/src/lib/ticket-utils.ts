export function ticketReference(id: string): string {
  return `TKT-${id.slice(0, 8).toUpperCase()}`;
}

export const ticketPriorityStyles = {
  low: {
    label: 'Low',
    pill: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30 font-semibold',
    stripe: 'border-l-4 border-l-slate-400 dark:border-l-slate-500',
    dot: 'bg-slate-400',
  },
  medium: {
    label: 'Medium',
    pill: 'bg-[#11adc4]/15 text-[#074b58] dark:text-[#38d8ef] border border-[#11adc4]/35 font-bold',
    stripe: 'border-l-4 border-l-[#11adc4]',
    dot: 'bg-[#11adc4]',
  },
  high: {
    label: 'High',
    pill: 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/35 font-bold',
    stripe: 'border-l-4 border-l-amber-500',
    dot: 'bg-amber-500',
  },
  critical: {
    label: 'Critical',
    pill: 'bg-rose-500/20 text-rose-800 dark:text-rose-200 border border-rose-500/40 font-black shadow-xs',
    stripe: 'border-l-4 border-l-rose-500',
    dot: 'bg-rose-500 animate-ping',
  },
} as const;
