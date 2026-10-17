import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'info';
  subtitle?: string;
  className?: string;
}

const StatCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  variant = 'default',
  subtitle,
  className 
}: StatCardProps) => {
  // Elegant colored icon badge styles (consistent status colors: emerald for success, amber for pending, blue for in-progress)
  const iconContainerStyles = {
    default: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50',
    primary: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50',
    accent:  'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50',
    warning: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50',
    info:    'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50',
  };

  const accentTopBorder = {
    default: 'group-hover:border-t-blue-500',
    primary: 'group-hover:border-t-blue-500',
    accent:  'group-hover:border-t-emerald-500',
    success: 'group-hover:border-t-emerald-500',
    warning: 'group-hover:border-t-amber-500',
    info:    'group-hover:border-t-blue-500',
  };

  return (
    <div
      className={cn(
        'group relative bg-card text-card-foreground rounded-xl border border-border/80 shadow-xs p-4 sm:p-5 transition-all duration-200 hover:shadow-md hover:border-primary/40',
        accentTopBorder[variant],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium text-muted-foreground truncate leading-none">
            {title}
          </p>
          <p className="text-[30px] sm:text-[32px] font-bold tracking-tight text-foreground mt-2 leading-none">
            {value}
          </p>
          {trend ? (
            <div className={cn(
              'flex items-center gap-1 mt-2.5 text-xs font-medium',
              trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            )}>
              {trend.isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate">{Math.abs(trend.value)}% vs last month</span>
            </div>
          ) : subtitle ? (
            <p className="text-[12px] sm:text-[13px] text-muted-foreground mt-2 truncate leading-snug">{subtitle}</p>
          ) : null}
        </div>
        <div className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105',
          iconContainerStyles[variant]
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
