'use client';

import { useRouter } from 'next/navigation';
import { FileText, Activity, CheckCircle, Receipt } from 'lucide-react';
import { StatCard } from './stat-card';
import type { DashboardStats } from '@/hooks/use-dashboard';

interface StatsGridProps {
  stats: DashboardStats | undefined;
  loading?: boolean;
}

export function StatsGrid({ stats, loading = false }: StatsGridProps) {
  const router = useRouter();

  // Format currency
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="სულ ქეისები"
        value={stats?.totalCases || 0}
        change={stats?.totalCasesChange}
        icon={FileText}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-100"
        onClick={() => router.push('/cases')}
        loading={loading}
      />

      <StatCard
        title="აქტიური ქეისები"
        value={stats?.activeCases || 0}
        change={stats?.activeCasesChange}
        icon={Activity}
        iconColor="text-yellow-600"
        iconBgColor="bg-yellow-100"
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
        iconBgColor="bg-green-100"
        onClick={() => router.push('/cases?status=completed')}
        loading={loading}
      />

      <StatCard
        title="გადაუხდელი ინვოისები"
        value={`${stats?.unpaidInvoices || 0} (${formatAmount(stats?.unpaidInvoicesAmount || 0)})`}
        icon={Receipt}
        iconColor="text-orange-600"
        iconBgColor="bg-orange-100"
        onClick={() => router.push('/invoices?status=unpaid')}
        loading={loading}
      />
    </div>
  );
}

export default StatsGrid;
