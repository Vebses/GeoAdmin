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
import { formatCurrency } from '@/lib/utils/format';
import type { EnhancedStats, CurrencyAmount } from '@/hooks/use-dashboard';

interface FinancialStatsProps {
  stats: EnhancedStats['financial'] | undefined;
  loading?: boolean;
}

interface FinancialCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  change?: number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  onClick?: () => void;
  loading?: boolean;
  valueColor?: string;
}

// Multi-currency display component
function CurrencyDisplay({
  amounts,
  loading,
  colorClass = 'text-gray-900'
}: {
  amounts: CurrencyAmount[] | undefined;
  loading?: boolean;
  colorClass?: string;
}) {
  if (loading) {
    return <div className="h-8 w-24 bg-gray-200 rounded" />;
  }

  if (!amounts || amounts.length === 0) {
    return <span className={cn('text-2xl font-bold', colorClass)}>-</span>;
  }

  // Single currency - display large
  if (amounts.length === 1) {
    return (
      <span className={cn('text-2xl font-bold', colorClass)}>
        {formatCurrency(amounts[0].amount, amounts[0].currency)}
      </span>
    );
  }

  // Multiple currencies - display stacked
  return (
    <div className="space-y-0.5">
      {amounts.map((item, idx) => (
        <div
          key={item.currency}
          className={cn(
            'font-bold',
            idx === 0 ? 'text-xl' : 'text-sm opacity-70',
            colorClass
          )}
        >
          {formatCurrency(item.amount, item.currency)}
        </div>
      ))}
    </div>
  );
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

            <div className={cn('mt-2', valueColor)}>
              {value}
            </div>

            {subtitle && !loading && (
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            )}

            {change !== undefined && !loading && (
              <div className="mt-2">
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
              </div>
            )}
          </div>

          <div className={cn('p-3 rounded-xl', iconBgColor)}>
            <div className={iconColor}>{icon}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FinancialStats({ stats, loading }: FinancialStatsProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Revenue */}
      <FinancialCard
        title="შემოსავალი"
        value={
          <CurrencyDisplay
            amounts={stats?.revenue}
            loading={loading}
            colorClass="text-green-600"
          />
        }
        change={stats?.revenueChange}
        icon={<Banknote className="h-6 w-6" />}
        iconBgColor="bg-gradient-to-br from-green-100 to-green-50"
        iconColor="text-green-600"
        onClick={() => router.push('/invoices?status=paid')}
        loading={loading}
      />

      {/* Outstanding */}
      <FinancialCard
        title="გადაუხდელი"
        value={
          <CurrencyDisplay
            amounts={stats?.outstanding}
            loading={loading}
            colorClass={stats && stats.overdueCount > 0 ? 'text-amber-600' : 'text-gray-900'}
          />
        }
        subtitle={stats ? `${stats.outstandingCount} ინვოისი${stats.overdueCount > 0 ? ` (${stats.overdueCount} ვადაგადაც.)` : ''}` : undefined}
        icon={<Clock className="h-6 w-6" />}
        iconBgColor="bg-gradient-to-br from-amber-100 to-amber-50"
        iconColor="text-amber-600"
        onClick={() => router.push('/invoices?status=unpaid')}
        loading={loading}
      />

      {/* Average Case Value */}
      <FinancialCard
        title="საშუალო/ქეისი"
        value={
          <CurrencyDisplay
            amounts={stats?.avgCaseValue}
            loading={loading}
            colorClass="text-blue-600"
          />
        }
        subtitle="საშუალო შემოსავალი ქეისზე"
        icon={<TrendingUp className="h-6 w-6" />}
        iconBgColor="bg-gradient-to-br from-blue-100 to-blue-50"
        iconColor="text-blue-600"
        loading={loading}
      />

      {/* Collection Rate */}
      <FinancialCard
        title="აკრეფის მაჩვენებელი"
        value={
          loading ? (
            <div className="h-8 w-16 bg-gray-200 rounded" />
          ) : (
            <span className={cn(
              'text-2xl font-bold',
              stats && stats.collectionRate >= 80 ? 'text-green-600' :
              stats && stats.collectionRate >= 60 ? 'text-amber-600' : 'text-red-600'
            )}>
              {stats?.collectionRate || 0}%
            </span>
          )
        }
        subtitle="გადახდილი / ჯამი"
        icon={<Percent className="h-6 w-6" />}
        iconBgColor={cn(
          'bg-gradient-to-br',
          stats && stats.collectionRate >= 80 ? 'from-green-100 to-green-50' :
          stats && stats.collectionRate >= 60 ? 'from-amber-100 to-amber-50' : 'from-red-100 to-red-50'
        )}
        iconColor={
          stats && stats.collectionRate >= 80 ? 'text-green-600' :
          stats && stats.collectionRate >= 60 ? 'text-amber-600' : 'text-red-600'
        }
        loading={loading}
      />
    </div>
  );
}

export default FinancialStats;
