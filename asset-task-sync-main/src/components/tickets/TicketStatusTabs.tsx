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
    label: 'All Tickets',
    icon: LayoutGrid,
    countClass: 'bg-muted-foreground/15 text-foreground group-data-[state=active]:bg-white/25 group-data-[state=active]:text-white',
    activeClass: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#11adc4] data-[state=active]:to-[#0e92a6] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-[#11adc4]/25',
  },
  {
    value: 'pending',
    label: 'Pending',
    icon: CircleDashed,
    countClass: 'bg-amber-500/20 text-amber-800 dark:text-amber-200 group-data-[state=active]:bg-white/25 group-data-[state=active]:text-white',
    activeClass: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-amber-500/25',
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    icon: PlayCircle,
    countClass: 'bg-[#11adc4]/25 text-[#074b58] dark:text-[#38d8ef] group-data-[state=active]:bg-white/25 group-data-[state=active]:text-white',
    activeClass: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#11adc4] data-[state=active]:to-[#0f5766] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-[#11adc4]/25',
  },
  {
    value: 'review',
    label: 'In Review',
    icon: ClipboardCheck,
    countClass: 'bg-[#0f5766]/20 text-[#0f5766] dark:text-[#7ce5f5] group-data-[state=active]:bg-white/25 group-data-[state=active]:text-white',
    activeClass: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0f5766] data-[state=active]:to-[#093d4a] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-[#0f5766]/25',
  },
  {
    value: 'completed',
    label: 'Completed',
    icon: CheckCircle2,
    countClass: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 group-data-[state=active]:bg-white/25 group-data-[state=active]:text-white',
    activeClass: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-emerald-500/25',
  },
];

export function TicketStatusTabs({ counts }: TicketStatusTabsProps) {
  return (
    <div className="w-full overflow-x-auto pb-1 scrollbar-thin">
      <TabsList
        className={cn(
          'mb-0 flex h-auto w-full min-w-max sm:min-w-0 gap-1.5 sm:gap-2 rounded-2xl border border-border/80 bg-card p-1.5',
          'shadow-sm',
        )}
      >
        {tabs.map(({ value, label, icon: Icon, countClass, activeClass }) => (
          <TabsTrigger
            key={value}
            value={value}
            className={cn(
              'group relative flex flex-1 items-center justify-center gap-2 rounded-xl border border-transparent',
              'px-3 py-2.5 sm:px-4 sm:py-3 min-w-[7.5rem]',
              'text-sm sm:text-[15px] font-bold text-muted-foreground transition-all duration-200',
              'hover:text-foreground hover:bg-muted/50',
              'focus-visible:ring-2 focus-visible:ring-primary/40',
              activeClass,
            )}
          >
            <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px] shrink-0 opacity-80 group-data-[state=active]:opacity-100" aria-hidden />
            <span className="whitespace-nowrap">{label}</span>
            <span
              className={cn(
                'inline-flex min-w-[1.625rem] items-center justify-center rounded-full px-2 py-0.5',
                'text-xs font-black tabular-nums leading-none transition-colors',
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
