'use client';

import { useRouter } from 'next/navigation';
import { FileText, Activity, CheckCircle, Receipt } from 'lucide-react';
import { StatCard } from './stat-card';
import { formatCurrency } from '@/lib/utils/format';
import type { DashboardStats } from '@/hooks/use-dashboard';

interface StatsGridProps {
  stats: DashboardStats | undefined;
  loading?: boolean;
}

export function StatsGrid({ stats, loading = false }: StatsGridProps) {
  const router = useRouter();

  // Format unpaid amounts - show multi-currency if available
  const formatUnpaidValue = () => {
    if (!stats) return '0';

    const count = stats.unpaidInvoices || 0;

    // Use multi-currency if available
    if (stats.unpaidByCurrency && stats.unpaidByCurrency.length > 0) {
      const currencyStrings = stats.unpaidByCurrency
        .map(c => formatCurrency(c.amount, c.currency))
        .join(' / ');
      return `${count} (${currencyStrings})`;
    }

    // Fallback to single amount (for backwards compatibility)
    if (stats.unpaidInvoicesAmount) {
      return `${count} (${formatCurrency(stats.unpaidInvoicesAmount, 'EUR')})`;
    }

    return String(count);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="სულ ქეისები"
        value={stats?.totalCases || 0}
        change={stats?.totalCasesChange}
        icon={FileText}
        iconColor="text-blue-600"
        iconBgColor="bg-gradient-to-br from-blue-100 to-blue-50"
        onClick={() => router.push('/cases')}
        loading={loading}
      />

      <StatCard
        title="აქტიური ქეისები"
        value={stats?.activeCases || 0}
        change={stats?.activeCasesChange}
        icon={Activity}
        iconColor="text-amber-600"
        iconBgColor="bg-gradient-to-br from-amber-100 to-amber-50"
        onClick={() => router.push('/cases?status=in_progress')}
        loading={loading}
      />

      <StatCard
        title="დასრულებული"
        subtitle="ამ თვეში"
        value={stats?.completedThisMonth || 0}
        change={stats?.completedChange}
        icon={CheckCircle}
        iconColor="text-green-600"
        iconBgColor="bg-gradient-to-br from-green-100 to-green-50"
        onClick={() => router.push('/cases?status=completed')}
        loading={loading}
      />

      <StatCard
        title="გადაუხდელი ინვოისები"
        value={formatUnpaidValue()}
        icon={Receipt}
        iconColor="text-orange-600"
        iconBgColor="bg-gradient-to-br from-orange-100 to-orange-50"
        onClick={() => router.push('/invoices?status=unpaid')}
        loading={loading}
      />
    </div>
  );
}

export default StatsGrid;
