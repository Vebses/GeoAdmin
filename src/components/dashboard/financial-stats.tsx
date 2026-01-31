'use client';

import { useRouter } from 'next/navigation';
import {
  Banknote,
  Clock,
  TrendingUp,
  Percent,
  TrendingDown,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EnhancedStats } from '@/hooks/use-dashboard';

interface FinancialStatsProps {
  stats: EnhancedStats['financial'] | undefined;
  loading?: boolean;
}

interface FinancialCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  onClick?: () => void;
  loading?: boolean;
  valueColor?: string;
}

function FinancialCard({
  title,
  value,
  subtitle,
  change,
  icon,
  iconBgColor,
  iconColor,
  onClick,
  loading,
  valueColor = 'text-gray-900',
}: FinancialCardProps) {
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

          {loading ? (
            <div className="h-8 w-24 bg-gray-200 rounded mt-2" />
          ) : (
            <p className={cn('text-2xl font-bold mt-2', valueColor)}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          )}

          {subtitle && !loading && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}

          {change !== undefined && !loading && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive && (
                <>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">+{change}%</span>
                </>
              )}
              {isNegative && (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-600">{change}%</span>
                </>
              )}
              {isNeutral && (
                <>
                  <Minus className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-500">0%</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className={cn('p-3 rounded-lg', iconBgColor)}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

export function FinancialStats({ stats, loading }: FinancialStatsProps) {
  const router = useRouter();

  const formatCurrency = (amount: number): string => {
    return `₾${amount.toLocaleString('ka-GE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Revenue */}
      <FinancialCard
        title="შემოსავალი"
        value={stats ? formatCurrency(stats.revenue) : '₾0'}
        change={stats?.revenueChange}
        icon={<Banknote className="h-6 w-6" />}
        iconBgColor="bg-green-100"
        iconColor="text-green-600"
        onClick={() => router.push('/invoices?status=paid')}
        loading={loading}
        valueColor="text-green-600"
      />

      {/* Outstanding */}
      <FinancialCard
        title="გადაუხდელი"
        value={stats ? formatCurrency(stats.outstanding) : '₾0'}
        subtitle={stats ? `${stats.outstandingCount} ინვოისი${stats.overdueCount > 0 ? ` (${stats.overdueCount} ვადაგადაც.)` : ''}` : undefined}
        icon={<Clock className="h-6 w-6" />}
        iconBgColor="bg-amber-100"
        iconColor="text-amber-600"
        onClick={() => router.push('/invoices?status=unpaid')}
        loading={loading}
        valueColor={stats && stats.overdueCount > 0 ? 'text-amber-600' : 'text-gray-900'}
      />

      {/* Average Case Value */}
      <FinancialCard
        title="საშუალო/ქეისი"
        value={stats ? formatCurrency(stats.avgCaseValue) : '₾0'}
        subtitle="საშუალო შემოსავალი ქეისზე"
        icon={<TrendingUp className="h-6 w-6" />}
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
        loading={loading}
      />

      {/* Collection Rate */}
      <FinancialCard
        title="აკრეფის მაჩვენებელი"
        value={stats ? `${stats.collectionRate}%` : '0%'}
        subtitle="გადახდილი / ჯამი"
        icon={<Percent className="h-6 w-6" />}
        iconBgColor={stats && stats.collectionRate >= 80 ? 'bg-green-100' : stats && stats.collectionRate >= 60 ? 'bg-amber-100' : 'bg-red-100'}
        iconColor={stats && stats.collectionRate >= 80 ? 'text-green-600' : stats && stats.collectionRate >= 60 ? 'text-amber-600' : 'text-red-600'}
        loading={loading}
        valueColor={stats && stats.collectionRate >= 80 ? 'text-green-600' : stats && stats.collectionRate >= 60 ? 'text-amber-600' : 'text-red-600'}
      />
    </div>
  );
}

export default FinancialStats;
