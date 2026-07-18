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
  className?: string;
}

const StatCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  variant = 'default',
  className 
}: StatCardProps) => {

  // Premium border accents per variant
  const variantBorder = {
    default:  'border-l-4 border-l-slate-400 dark:border-l-slate-600',
    primary:  'border-l-4 border-l-violet-500',
    accent:   'border-l-4 border-l-teal-500',
    success:  'border-l-4 border-l-emerald-500',
    warning:  'border-l-4 border-l-amber-500',
    info:     'border-l-4 border-l-sky-500',
  };

  // Subtle background tints (all work in both light and dark mode)
  const variantBg = {
    default: 'bg-card',
    primary: 'bg-violet-50/40 dark:bg-violet-950/10',
    accent:  'bg-teal-50/40 dark:bg-teal-950/10',
    success: 'bg-emerald-50/40 dark:bg-emerald-950/10',
    warning: 'bg-amber-50/40 dark:bg-amber-950/10',
    info:    'bg-sky-50/40 dark:bg-sky-950/10',
  };

  // Icon container colors
  const iconBg = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    primary: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
    accent:  'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400',
    success: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    info:    'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400',
  };

  // Trend text colors per variant
  const trendPositive = {
    default: 'text-emerald-600 dark:text-emerald-400',
    primary: 'text-violet-600 dark:text-violet-400',
    accent:  'text-teal-600 dark:text-teal-400',
    success: 'text-emerald-700 dark:text-emerald-300',
    warning: 'text-amber-700 dark:text-amber-300',
    info:    'text-sky-600 dark:text-sky-400',
  };

  return (
    <div
      className={cn(
        'stat-card rounded-xl border border-border/50 shadow-sm',
        'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        variantBg[variant],
        variantBorder[variant],
        className
      )}
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-sm font-medium mb-1 text-muted-foreground">
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-xs font-medium',
              trend.isPositive ? trendPositive[variant] : 'text-destructive'
            )}>
              {trend.isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              <span>{Math.abs(trend.value)}% from last month</span>
            </div>
          )}
        </div>
        <div className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl shadow-sm',
          iconBg[variant]
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;

