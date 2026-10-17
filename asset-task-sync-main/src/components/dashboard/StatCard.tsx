import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export type StatCardVariant = 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'info';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: StatCardVariant;
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
  // Top gradient accent stripe
  const topStripeStyles: Record<StatCardVariant, string> = {
    default:   'bg-gradient-to-r from-[#11adc4] via-[#2cd4ec] to-[#0e92a6]',
    primary:   'bg-gradient-to-r from-[#11adc4] via-[#2cd4ec] to-[#0e92a6]',
    secondary: 'bg-gradient-to-r from-[#0f5766] via-[#11adc4] to-[#0f5766]',
    success:   'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600',
    warning:   'bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500',
    info:      'bg-gradient-to-r from-[#11adc4] via-[#38d8ef] to-[#0f5766]',
    accent:    'bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-600',
  };

  // Card background tint and border
  const cardFrameStyles: Record<StatCardVariant, string> = {
    default:   'bg-gradient-to-b from-[#11adc4]/[0.08] via-card to-card border-[#11adc4]/30 dark:border-[#11adc4]/40 hover:border-[#11adc4] hover:shadow-lg hover:shadow-[#11adc4]/15',
    primary:   'bg-gradient-to-b from-[#11adc4]/[0.08] via-card to-card border-[#11adc4]/30 dark:border-[#11adc4]/40 hover:border-[#11adc4] hover:shadow-lg hover:shadow-[#11adc4]/15',
    secondary: 'bg-gradient-to-b from-[#0f5766]/[0.09] via-card to-card border-[#0f5766]/30 dark:border-[#0f5766]/40 hover:border-[#0f5766] hover:shadow-lg hover:shadow-[#0f5766]/15',
    success:   'bg-gradient-to-b from-emerald-500/[0.08] via-card to-card border-emerald-500/30 dark:border-emerald-500/40 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/15',
    warning:   'bg-gradient-to-b from-amber-500/[0.09] via-card to-card border-amber-500/30 dark:border-amber-500/40 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/15',
    info:      'bg-gradient-to-b from-[#11adc4]/[0.09] via-card to-card border-[#11adc4]/30 dark:border-[#11adc4]/40 hover:border-[#11adc4] hover:shadow-lg hover:shadow-[#11adc4]/15',
    accent:    'bg-gradient-to-b from-teal-500/[0.08] via-card to-card border-teal-500/30 dark:border-teal-500/40 hover:border-teal-500 hover:shadow-lg hover:shadow-teal-500/15',
  };

  // Vivid glowing solid gradient icon badges
  const iconBadgeStyles: Record<StatCardVariant, string> = {
    default:   'bg-gradient-to-br from-[#11adc4] to-[#0e92a6] text-white shadow-md shadow-[#11adc4]/35 ring-4 ring-[#11adc4]/15',
    primary:   'bg-gradient-to-br from-[#11adc4] to-[#0e92a6] text-white shadow-md shadow-[#11adc4]/35 ring-4 ring-[#11adc4]/15',
    secondary: 'bg-gradient-to-br from-[#0f5766] to-[#093d4a] text-white shadow-md shadow-[#0f5766]/35 ring-4 ring-[#0f5766]/15',
    success:   'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/35 ring-4 ring-emerald-500/15',
    warning:   'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/35 ring-4 ring-amber-500/15',
    info:      'bg-gradient-to-br from-[#11adc4] to-[#0f5766] text-white shadow-md shadow-[#11adc4]/35 ring-4 ring-[#11adc4]/15',
    accent:    'bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/35 ring-4 ring-teal-500/15',
  };

  // Subtitle pill badge
  const subtitlePillStyles: Record<StatCardVariant, string> = {
    default:   'bg-[#11adc4]/10 text-[#095260] dark:text-[#38d8ef] border-[#11adc4]/20',
    primary:   'bg-[#11adc4]/10 text-[#095260] dark:text-[#38d8ef] border-[#11adc4]/20',
    secondary: 'bg-[#0f5766]/10 text-[#0f5766] dark:text-[#b2e8f0] border-[#0f5766]/20',
    success:   'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    warning:   'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    info:      'bg-[#11adc4]/10 text-[#095260] dark:text-[#38d8ef] border-[#11adc4]/20',
    accent:    'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20',
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border transition-all duration-300 ease-out shadow-xs hover:-translate-y-1',
        cardFrameStyles[variant],
        className
      )}
    >
      {/* 3.5px Radiant Top Gradient Stripe */}
      <div className={cn('h-[3.5px] w-full', topStripeStyles[variant])} />

      <div className="p-4 sm:p-5 relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] sm:text-[14px] font-semibold tracking-wide text-muted-foreground uppercase leading-tight truncate">
              {title}
            </p>
            <p className="text-[30px] sm:text-[34px] font-black tracking-tight text-foreground mt-2 leading-none">
              {value}
            </p>
          </div>

          {/* Vivid Glowing Icon Badge */}
          <div className={cn(
            'flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3',
            iconBadgeStyles[variant]
          )}>
            {React.isValidElement(icon) ? (
              React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                className: cn('h-5 w-5 sm:h-6 sm:w-6 text-white stroke-[2.2]', (icon as React.ReactElement<{ className?: string }>).props.className),
              })
            ) : icon}
          </div>
        </div>

        {/* Subtitle / Trend Row */}
        <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between gap-2">
          {trend ? (
            <div className={cn(
              'flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border',
              trend.isPositive 
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
            )}>
              {trend.isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate">{Math.abs(trend.value)}% vs last month</span>
            </div>
          ) : subtitle ? (
            <span className={cn(
              'inline-flex items-center text-[11px] sm:text-[12px] font-medium px-2 py-0.5 rounded-md border truncate max-w-full',
              subtitlePillStyles[variant]
            )}>
              {subtitle}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
