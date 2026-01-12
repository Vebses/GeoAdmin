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
        'bg-white rounded-xl border border-gray-200 p-5 transition-all',
        onClick && 'cursor-pointer hover:border-blue-300 hover:shadow-md',
        loading && 'animate-pulse'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          )}
          
          {loading ? (
            <div className="h-8 w-20 bg-gray-200 rounded mt-2" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          )}

          {change !== undefined && !loading && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive && (
                <>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">
                    +{change}%
                  </span>
                </>
              )}
              {isNegative && (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-600">
                    {change}%
                  </span>
                </>
              )}
              {isNeutral && (
                <>
                  <Minus className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-500">
                    0%
                  </span>
                </>
              )}
              <span className="text-xs text-gray-400 ml-1">
                {changePeriod}
              </span>
            </div>
          )}
        </div>

        <div className={cn('p-3 rounded-lg', iconBgColor)}>
          <Icon className={cn('h-6 w-6', iconColor)} />
        </div>
      </div>
    </div>
  );
}

export default StatCard;
