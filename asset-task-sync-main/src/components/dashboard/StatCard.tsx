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
  // Rich full-color gradient backgrounds (matching department cards)
  const cardGradients: Record<StatCardVariant, string> = {
    default:   'bg-gradient-to-br from-[#11adc4] via-[#0ea0b6] to-[#077d8f] shadow-lg shadow-[#11adc4]/20 hover:shadow-xl hover:shadow-[#11adc4]/30',
    primary:   'bg-gradient-to-br from-[#11adc4] via-[#0ea0b6] to-[#077d8f] shadow-lg shadow-[#11adc4]/20 hover:shadow-xl hover:shadow-[#11adc4]/30',
    secondary: 'bg-gradient-to-br from-[#0f5766] via-[#0b4754] to-[#073640] shadow-lg shadow-[#0f5766]/25 hover:shadow-xl hover:shadow-[#0f5766]/35',
    success:   'bg-gradient-to-br from-[#059669] via-[#047857] to-[#065f46] shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/30',
    warning:   'bg-gradient-to-br from-[#d97706] via-[#b45309] to-[#92400e] shadow-lg shadow-amber-600/25 hover:shadow-xl hover:shadow-amber-600/35',
    info:      'bg-gradient-to-br from-[#0891b2] via-[#0e7490] to-[#155e75] shadow-lg shadow-cyan-600/20 hover:shadow-xl hover:shadow-cyan-600/30',
    accent:    'bg-gradient-to-br from-[#143e49] via-[#0f323c] to-[#09222a] shadow-lg shadow-teal-900/30 hover:shadow-xl hover:shadow-teal-900/40',
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/20 text-white transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:border-white/50',
        cardGradients[variant],
        className
      )}
    >
      {/* Decorative subtle ambient glow in bottom-right */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />

      {/* Top subtle highlight line */}
      <div className="h-[2px] w-full bg-white/30" />

      <div className="p-4 sm:p-5 relative z-10 flex flex-col justify-between min-h-[148px]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] sm:text-[13px] font-bold tracking-wider text-white/85 uppercase leading-tight truncate drop-shadow-xs">
              {title}
            </p>
            <p className="text-[30px] sm:text-[34px] font-black tracking-tight text-white mt-2 leading-none drop-shadow-xs">
              {value}
            </p>
          </div>

          {/* Frosted Glass Icon Badge (matching department cards) */}
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs border border-white/30 text-white shadow-xs transition-all duration-300 group-hover:bg-white/30 group-hover:scale-110 group-hover:rotate-3">
            {React.isValidElement(icon) ? (
              React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                className: cn('h-5 w-5 sm:h-6 sm:w-6 text-white stroke-[2.3]', (icon as React.ReactElement<{ className?: string }>).props.className),
              })
            ) : icon}
          </div>
        </div>

        {/* Subtitle / Trend Row */}
        <div className="mt-4 pt-2.5 border-t border-white/20 flex items-center justify-between gap-2">
          {trend ? (
            <div className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-xs shadow-2xs">
              {trend.isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
              )}
              <span className="truncate">{Math.abs(trend.value)}% vs last month</span>
            </div>
          ) : subtitle ? (
            <span className="inline-flex items-center text-[11px] sm:text-[12px] font-semibold px-2.5 py-0.5 rounded-lg bg-white/20 text-white border border-white/30 backdrop-blur-xs shadow-2xs truncate max-w-full">
              {subtitle}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
