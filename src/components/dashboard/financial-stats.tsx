'use client';

import { useRouter } from 'next/navigation';
import {
  Banknote,
  Clock,
  Percent,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format';
import { Skeleton } from '@/components/ui/skeleton';
import type { EnhancedStats, CurrencyFinancialRow, CurrencyCode } from '@/hooks/use-dashboard';

interface FinancialStatsProps {
  stats: EnhancedStats['financial'] | undefined;
  loading?: boolean;
}

// Currency display config
const currencyConfig: Record<CurrencyCode, { symbol: string; name: string; flag: string }> = {
  GEL: { symbol: '₾', name: 'ლარი', flag: '🇬🇪' },
  USD: { symbol: '$', name: 'დოლარი', flag: '🇺🇸' },
  EUR: { symbol: '€', name: 'ევრო', flag: '🇪🇺' },
};

// Summary card component
function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor,
  iconColor,
  change,
  onClick,
  loading,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: typeof Banknote;
  iconBgColor: string;
  iconColor: string;
  change?: number;
  onClick?: () => void;
  loading?: boolean;
}) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-8 w-28" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-100 p-4',
        'hover:shadow-md transition-all duration-200',
        onClick && 'cursor-pointer hover:-translate-y-0.5'
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        <div className={cn('p-2 rounded-lg', iconBgColor)}>
          <Icon className={cn('h-4 w-4', iconColor)} />
        </div>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      )}
      {change !== undefined && (
        <div className="mt-2">
          <span className={cn(
            'inline-flex items-center gap-1 text-xs font-medium',
            isPositive && 'text-green-600',
            isNegative && 'text-red-600',
            !isPositive && !isNegative && 'text-gray-500'
          )}>
            {isPositive && <TrendingUp className="h-3 w-3" />}
            {isNegative && <TrendingDown className="h-3 w-3" />}
            {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
            {isPositive && '+'}{change}%
          </span>
        </div>
      )}
    </div>
  );
}

export function FinancialStats({ stats, loading }: FinancialStatsProps) {
  const router = useRouter();

  // All 3 currencies - always show all for consistency
  const allCurrencies: CurrencyCode[] = ['GEL', 'USD', 'EUR'];

  // Get data for each currency, defaulting to 0 if not present
  const getCurrencyData = (currency: CurrencyCode): CurrencyFinancialRow => {
    const found = stats?.byCurrency?.find(c => c.currency === currency);
    return found || {
      currency,
      revenue: 0,
      outstanding: 0,
      invoiceCount: 0,
      unpaidCount: 0,
    };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  // Calculate totals (can't sum different currencies meaningfully, but show count)
  const totalRevenue = stats?.revenueTotal || 0;
  const totalOutstanding = stats?.outstandingTotal || 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          ფინანსური მიმოხილვა ვალუტების მიხედვით
        </h3>
        <div className="flex items-center gap-3">
          <span className={cn(
            'text-xs px-2 py-1 rounded-full font-medium',
            stats?.collectionRate && stats.collectionRate >= 80 ? 'bg-green-100 text-green-700' :
            stats?.collectionRate && stats.collectionRate >= 60 ? 'bg-amber-100 text-amber-700' :
            'bg-red-100 text-red-700'
          )}>
            <Percent className="h-3 w-3 inline mr-1" />
            აკრეფა: {stats?.collectionRate || 0}%
          </span>
        </div>
      </div>

      {/* Currency Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">
                ვალუტა
              </th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">
                შემოსავალი
                <span className="block text-[10px] font-normal normal-case text-gray-400">ამ პერიოდში</span>
              </th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">
                გადაუხდელი
                <span className="block text-[10px] font-normal normal-case text-gray-400">სულ</span>
              </th>
              <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">
                ინვოისები
              </th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3 w-12">
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allCurrencies.map(currency => {
              const data = getCurrencyData(currency);
              const config = currencyConfig[currency];
              const hasData = data.invoiceCount > 0 || data.revenue > 0 || data.outstanding > 0;

              return (
                <tr
                  key={currency}
                  className={cn(
                    'hover:bg-gray-50/50 transition-colors',
                    !hasData && 'opacity-50'
                  )}
                >
                  {/* Currency */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{config.flag}</span>
                      <div>
                        <span className="font-semibold text-gray-900">{currency}</span>
                        <span className="text-xs text-gray-400 ml-2">{config.name}</span>
                      </div>
                    </div>
                  </td>

                  {/* Revenue */}
                  <td className="px-5 py-4 text-right">
                    <span className={cn(
                      'font-bold',
                      data.revenue > 0 ? 'text-green-600' : 'text-gray-400'
                    )}>
                      {data.revenue > 0
                        ? formatCurrency(data.revenue, currency)
                        : `0 ${config.symbol}`}
                    </span>
                  </td>

                  {/* Outstanding */}
                  <td className="px-5 py-4 text-right">
                    <span className={cn(
                      'font-bold',
                      data.outstanding > 0 ? 'text-amber-600' : 'text-gray-400'
                    )}>
                      {data.outstanding > 0
                        ? formatCurrency(data.outstanding, currency)
                        : `0 ${config.symbol}`}
                    </span>
                    {data.unpaidCount > 0 && (
                      <span className="block text-xs text-gray-400">
                        {data.unpaidCount} ინვოისი
                      </span>
                    )}
                  </td>

                  {/* Invoice Count */}
                  <td className="px-5 py-4 text-center">
                    <span className={cn(
                      'inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full text-sm font-medium',
                      data.invoiceCount > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-400'
                    )}>
                      {data.invoiceCount}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-5 py-4">
                    {hasData && (
                      <button
                        onClick={() => router.push(`/invoices?currency=${currency}`)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard
            title="შემოსავალი"
            value={stats?.revenue && stats.revenue.length > 0
              ? stats.revenue.map(r => formatCurrency(r.amount, r.currency)).join(' + ')
              : '0'}
            subtitle="ამ პერიოდში"
            icon={Banknote}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            change={stats?.revenue && stats.revenue.length > 0 ? stats.revenueChange : undefined}
            onClick={() => router.push('/invoices?status=paid')}
          />
          <SummaryCard
            title="გადაუხდელი"
            value={stats?.outstanding && stats.outstanding.length > 0
              ? stats.outstanding.map(r => formatCurrency(r.amount, r.currency)).join(' + ')
              : '0'}
            subtitle={`${stats?.outstandingCount || 0} ინვოისი`}
            icon={Clock}
            iconBgColor="bg-amber-100"
            iconColor="text-amber-600"
            onClick={() => router.push('/invoices?status=unpaid')}
          />
          <SummaryCard
            title="ვადაგადაცილებული"
            value={String(stats?.overdueCount || 0)}
            subtitle="30+ დღე"
            icon={Clock}
            iconBgColor="bg-red-100"
            iconColor="text-red-600"
            onClick={() => router.push('/invoices?status=unpaid')}
          />
          <SummaryCard
            title="აკრეფის მაჩვენებელი"
            value={`${stats?.collectionRate || 0}%`}
            subtitle="გადახდილი / ჯამი"
            icon={Percent}
            iconBgColor={cn(
              stats?.collectionRate && stats.collectionRate >= 80 ? 'bg-green-100' :
              stats?.collectionRate && stats.collectionRate >= 60 ? 'bg-amber-100' : 'bg-red-100'
            )}
            iconColor={cn(
              stats?.collectionRate && stats.collectionRate >= 80 ? 'text-green-600' :
              stats?.collectionRate && stats.collectionRate >= 60 ? 'text-amber-600' : 'text-red-600'
            )}
          />
        </div>
      </div>
    </div>
  );
}

export default FinancialStats;
