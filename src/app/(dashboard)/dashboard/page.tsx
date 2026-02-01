'use client';

import { useState, useEffect } from 'react';
import { LayoutDashboard, Plus, FileText, Receipt, Building2, Users } from 'lucide-react';
import {
  StatsGrid,
  PeriodSelector,
  CasesChart,
  StatusBreakdown,
  RecentActivity,
  AlertsPanel,
  TeamWorkload,
  FinancialStats,
  SectionHeader,
} from '@/components/dashboard';
import type { Period } from '@/components/dashboard';
import {
  useDashboardStats,
  useDashboardCharts,
  useDashboardActivity,
  useEnhancedStats,
  useDashboardAlerts,
  useTeamPerformance,
} from '@/hooks/use-dashboard';
import { useRealtimeDashboard } from '@/hooks/use-realtime';
import { useAuth } from '@/hooks/use-auth';
import { canViewTeam, canViewFinancial } from '@/lib/constants/roles';
import { cn } from '@/lib/utils';

// Quick action configuration
const quickActions = [
  {
    href: '/cases',
    label: 'ახალი ქეისი',
    icon: Plus,
    gradient: 'from-blue-500 to-blue-600',
    hoverBorder: 'hover:border-blue-300',
    hoverBg: 'hover:bg-blue-50/50',
  },
  {
    href: '/invoices',
    label: 'ახალი ინვოისი',
    icon: Receipt,
    gradient: 'from-green-500 to-green-600',
    hoverBorder: 'hover:border-green-300',
    hoverBg: 'hover:bg-green-50/50',
  },
  {
    href: '/partners',
    label: 'პარტნიორები',
    icon: Users,
    gradient: 'from-purple-500 to-purple-600',
    hoverBorder: 'hover:border-purple-300',
    hoverBg: 'hover:bg-purple-50/50',
  },
  {
    href: '/our-companies',
    label: 'კომპანიები',
    icon: Building2,
    gradient: 'from-orange-500 to-orange-600',
    hoverBorder: 'hover:border-orange-300',
    hoverBg: 'hover:bg-orange-50/50',
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

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

  // Role checks - uses centralized role constants from @/lib/constants/roles
  const canSeeFinancial = canViewFinancial(user?.role);
  const canSeeTeam = canViewTeam(user?.role);

  // Fetch data
  const { data: stats, isLoading: statsLoading } = useDashboardStats(period);
  const { data: charts, isLoading: chartsLoading } = useDashboardCharts(period);
  const { data: activities, isLoading: activityLoading, refetch: refetchActivity } = useDashboardActivity(10);

  // Enhanced data
  const { data: enhancedStats, isLoading: enhancedLoading } = useEnhancedStats(period);
  const { data: alerts, isLoading: alertsLoading } = useDashboardAlerts();
  const { data: teamData, isLoading: teamLoading } = useTeamPerformance(period);

  // Enable realtime updates
  useRealtimeDashboard();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      <div className="p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
        {/* Enhanced Header */}
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25">
              <LayoutDashboard className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">დეშბორდი</h1>
              <p className="text-sm text-gray-500 mt-0.5">მიმოხილვა და სტატისტიკა</p>
            </div>
          </div>

          <PeriodSelector value={period} onChange={handlePeriodChange} />
        </header>

        {/* Section: Key Metrics */}
        <section>
          <SectionHeader title="ძირითადი მეტრიკები" />
          <StatsGrid stats={stats} loading={statsLoading} />
        </section>

        {/* Section: Financial Overview */}
        {canSeeFinancial && (
          <section>
            <SectionHeader
              title="ფინანსური მიმოხილვა"
              badge={enhancedStats?.financial?.outstandingCount ? `${enhancedStats.financial.outstandingCount} გადაუხდელი` : undefined}
              badgeVariant="warning"
            />
            <FinancialStats stats={enhancedStats?.financial} loading={enhancedLoading} />
          </section>
        )}

        {/* Section: Analytics */}
        <section>
          <SectionHeader title="ანალიტიკა" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CasesChart data={charts?.casesOverTime} loading={chartsLoading} />
            <StatusBreakdown data={charts?.statusBreakdown} loading={chartsLoading} />
          </div>
        </section>

        {/* Section: Alerts */}
        {canSeeTeam && alerts && (alerts.delayed?.count > 0 || alerts.overdue?.count > 0 || alerts.unassigned?.count > 0) && (
          <section>
            <SectionHeader
              title="გაფრთხილებები"
              badge={`${(alerts.delayed?.count || 0) + (alerts.overdue?.count || 0) + (alerts.unassigned?.count || 0)} ყურადღება`}
              badgeVariant="warning"
            />
            <AlertsPanel alerts={alerts} loading={alertsLoading} />
          </section>
        )}

        {/* Section: Team Workload */}
        {canSeeTeam && (
          <section>
            <SectionHeader title="გუნდის დატვირთვა" />
            <TeamWorkload members={teamData?.members} loading={teamLoading} />
          </section>
        )}

        {/* Section: Activity & Quick Actions */}
        <section>
          <SectionHeader title="აქტივობა და მოქმედებები" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentActivity
              activities={activities}
              loading={activityLoading}
              onRefresh={() => refetchActivity()}
            />

            {/* Quick Actions - Premium Style */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                სწრაფი მოქმედებები
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <a
                    key={action.href}
                    href={action.href}
                    className={cn(
                      'group relative flex items-center gap-3 p-4 rounded-xl',
                      'bg-gradient-to-br from-gray-50/50 to-white',
                      'border border-gray-100',
                      'hover:shadow-md transition-all duration-200',
                      'hover:-translate-y-0.5',
                      action.hoverBorder,
                      action.hoverBg
                    )}
                  >
                    <div className={cn(
                      'p-2.5 rounded-lg bg-gradient-to-br shadow-sm',
                      action.gradient
                    )}>
                      <action.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {action.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
