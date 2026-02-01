'use client';

import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  subtitle?: string;
  value: string | number;
  change?: number;
  changePeriod?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  onClick?: () => void;
  loading?: boolean;
}

export function StatCard({
  title,
  subtitle,
  value,
  change,
  changePeriod = 'წინა პერიოდთან',
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-100',
  onClick,
  loading = false,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change === 0;

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-white rounded-2xl border border-gray-100',
        'shadow-sm hover:shadow-md transition-all duration-200',
        onClick && 'cursor-pointer hover:-translate-y-0.5',
        loading && 'animate-pulse'
      )}
      onClick={onClick}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50/50" />

      <div className="relative p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
            )}

            {loading ? (
              <div className="h-9 w-24 bg-gray-200 rounded mt-3" />
            ) : (
              <p className="text-3xl font-bold text-gray-900 mt-3 tracking-tight">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
            )}

            {change !== undefined && !loading && (
              <div className="mt-3">
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                  isPositive && 'bg-green-50 text-green-700',
                  isNegative && 'bg-red-50 text-red-700',
                  isNeutral && 'bg-gray-50 text-gray-500'
                )}>
                  {isPositive && <TrendingUp className="h-3 w-3" />}
                  {isNegative && <TrendingDown className="h-3 w-3" />}
                  {isNeutral && <Minus className="h-3 w-3" />}
                  {isPositive && '+'}{change}%
                </span>
                <span className="text-xs text-gray-400 ml-2">
                  {changePeriod}
                </span>
              </div>
            )}
          </div>

          <div className={cn('p-3 rounded-xl', iconBgColor)}>
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatCard;
