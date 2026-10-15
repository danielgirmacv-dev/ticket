import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TicketsViewMode } from '@/hooks/useTicketsViewMode';

interface TicketViewToggleProps {
  value: TicketsViewMode;
  onChange: (mode: TicketsViewMode) => void;
  className?: string;
}

export function TicketViewToggle({ value, onChange, className }: TicketViewToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex rounded-xl border border-border/60 bg-muted/40 p-1 shadow-sm',
        className,
      )}
      role="group"
      aria-label="Ticket layout"
    >
      <button
        type="button"
        onClick={() => onChange('cards')}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all',
          value === 'cards'
            ? 'bg-background text-foreground shadow-sm border border-border/50'
            : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
        )}
        aria-pressed={value === 'cards'}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">Cards</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all',
          value === 'list'
            ? 'bg-background text-foreground shadow-sm border border-border/50'
            : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
        )}
        aria-pressed={value === 'list'}
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">List</span>
      </button>
    </div>
  );
}
