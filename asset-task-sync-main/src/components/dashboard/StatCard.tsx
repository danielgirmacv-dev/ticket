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
  const variantStyles = {
    default: 'bg-card',
    primary: 'bg-primary text-primary-foreground',
    accent: 'bg-accent text-accent-foreground',
    success: 'bg-success text-success-foreground',
    warning: 'bg-warning text-warning-foreground',
    info: 'bg-info text-info-foreground',
  };

  const iconBgStyles = {
    default: 'bg-muted text-foreground',
    primary: 'bg-primary-foreground/20 text-primary-foreground',
    accent: 'bg-accent-foreground/20 text-accent-foreground',
    success: 'bg-success-foreground/20 text-success-foreground',
    warning: 'bg-warning-foreground/20 text-warning-foreground',
    info: 'bg-info-foreground/20 text-info-foreground',
  };

  return (
    <div
      className={cn(
        'stat-card rounded-xl shadow-md border border-border/50 p-3 sm:p-4',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between relative z-10 gap-2">
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-xs sm:text-sm font-medium mb-1 truncate',
            variant === 'default' ? 'text-muted-foreground' : 'opacity-80'
          )}>
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</p>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-1 sm:mt-2 text-xs sm:text-sm',
              trend.isPositive 
                ? variant === 'default' ? 'text-success' : 'opacity-90'
                : variant === 'default' ? 'text-destructive' : 'opacity-90'
            )}>
              {trend.isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              )}
              <span className="truncate">{Math.abs(trend.value)}% from last month</span>
            </div>
          )}
        </div>
        <div className={cn(
          'flex h-9 w-9 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-lg',
          iconBgStyles[variant]
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
