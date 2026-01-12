'use client';

import { useState, useEffect } from 'react';
import { LayoutDashboard, Plus, FileText, Receipt, Building2, Users } from 'lucide-react';
import {
  StatsGrid,
  PeriodSelector,
  CasesChart,
  StatusBreakdown,
  RecentActivity,
} from '@/components/dashboard';
import type { Period } from '@/components/dashboard';
import { useDashboardStats, useDashboardCharts, useDashboardActivity } from '@/hooks/use-dashboard';

export default function DashboardPage() {
  // Load period from localStorage or default to 'month'
  const [period, setPeriod] = useState<Period>('month');

  useEffect(() => {
    const saved = localStorage.getItem('dashboard_period');
    if (saved && ['week', 'month', 'quarter', 'year'].includes(saved)) {
      setPeriod(saved as Period);
    }
  }, []);

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    localStorage.setItem('dashboard_period', newPeriod);
  };

  // Fetch data
  const { data: stats, isLoading: statsLoading } = useDashboardStats(period);
  const { data: charts, isLoading: chartsLoading } = useDashboardCharts(period);
  const { data: activities, isLoading: activityLoading, refetch: refetchActivity } = useDashboardActivity(10);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <LayoutDashboard className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">დეშბორდი</h1>
            <p className="text-sm text-gray-500">მიმოხილვა და სტატისტიკა</p>
          </div>
        </div>

        <PeriodSelector value={period} onChange={handlePeriodChange} />
      </div>

      {/* Stats Grid */}
      <StatsGrid stats={stats} loading={statsLoading} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CasesChart data={charts?.casesOverTime} loading={chartsLoading} />
        <StatusBreakdown data={charts?.statusBreakdown} loading={chartsLoading} />
      </div>

      {/* Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity 
          activities={activities} 
          loading={activityLoading}
          onRefresh={() => refetchActivity()}
        />
        
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            სწრაფი მოქმედებები
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="/cases"
              className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <Plus className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">ახალი ქეისი</span>
            </a>
            <a
              href="/invoices"
              className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <Receipt className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">ახალი ინვოისი</span>
            </a>
            <a
              href="/partners"
              className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">პარტნიორები</span>
            </a>
            <a
              href="/our-companies"
              className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
            >
              <div className="p-2 bg-orange-100 rounded-lg">
                <Building2 className="h-4 w-4 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">კომპანიები</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
