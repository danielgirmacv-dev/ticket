import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  LayoutGrid,
  PlayCircle,
} from 'lucide-react';

export type TicketTabValue = 'all' | 'pending' | 'in_progress' | 'review' | 'completed';

interface TicketStatusTabsProps {
  counts: Record<TicketTabValue, number>;
}

const tabs: {
  value: TicketTabValue;
  label: string;
  icon: typeof LayoutGrid;
  countClass: string;
  activeClass: string;
}[] = [
  {
    value: 'all',
    label: 'All',
    icon: LayoutGrid,
    countClass: 'bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    activeClass: 'data-[state=active]:bg-slate-900/5 data-[state=active]:text-foreground dark:data-[state=active]:bg-white/10',
  },
  {
    value: 'pending',
    label: 'Pending',
    icon: CircleDashed,
    countClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
    activeClass: 'data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-900 dark:data-[state=active]:text-amber-100',
  },
  {
    value: 'in_progress',
    label: 'In progress',
    icon: PlayCircle,
    countClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
    activeClass: 'data-[state=active]:bg-sky-500/10 data-[state=active]:text-sky-900 dark:data-[state=active]:text-sky-100',
  },
  {
    value: 'review',
    label: 'In review',
    icon: ClipboardCheck,
    countClass: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
    activeClass: 'data-[state=active]:bg-violet-500/10 data-[state=active]:text-violet-900 dark:data-[state=active]:text-violet-100',
  },
  {
    value: 'completed',
    label: 'Completed',
    icon: CheckCircle2,
    countClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
    activeClass: 'data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-900 dark:data-[state=active]:text-emerald-100',
  },
];

export function TicketStatusTabs({ counts }: TicketStatusTabsProps) {
  return (
    <div className="w-full overflow-x-auto pb-1 scrollbar-thin">
      <TabsList
        className={cn(
          'mb-0 flex h-auto w-full min-w-max sm:min-w-0 gap-1.5 sm:gap-2 rounded-2xl border border-border/60 bg-muted/40 p-2',
          'shadow-sm backdrop-blur-sm',
        )}
      >
        {tabs.map(({ value, label, icon: Icon, countClass, activeClass }) => (
          <TabsTrigger
            key={value}
            value={value}
            className={cn(
              'group relative flex flex-1 items-center justify-center gap-2 rounded-xl border border-transparent',
              'px-3 py-3 sm:px-4 sm:py-3.5 min-w-[7.5rem]',
              'text-sm sm:text-[15px] font-semibold text-muted-foreground transition-all duration-200',
              'hover:text-foreground hover:bg-background/60',
              'data-[state=active]:border-border/50 data-[state=active]:bg-background data-[state=active]:shadow-md',
              'focus-visible:ring-2 focus-visible:ring-[#1AB1C7]/40',
              activeClass,
            )}
          >
            <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px] shrink-0 opacity-70 group-data-[state=active]:opacity-100" aria-hidden />
            <span className="whitespace-nowrap">{label}</span>
            <span
              className={cn(
                'inline-flex min-w-[1.625rem] items-center justify-center rounded-full px-2 py-0.5',
                'text-xs font-bold tabular-nums leading-none',
                countClass,
              )}
            >
              {counts[value]}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
}
