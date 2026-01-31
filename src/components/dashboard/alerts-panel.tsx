'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, Clock, UserX, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardAlerts } from '@/hooks/use-dashboard';

interface AlertsPanelProps {
  alerts: DashboardAlerts | undefined;
  loading?: boolean;
}

interface AlertRowProps {
  icon: React.ReactNode;
  count: number;
  title: string;
  description: string;
  link: string;
  variant: 'warning' | 'danger' | 'info';
}

function AlertRow({ icon, count, title, description, link, variant }: AlertRowProps) {
  const router = useRouter();

  if (count === 0) return null;

  const variantStyles = {
    warning: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
    danger: 'bg-red-50 border-red-200 hover:bg-red-100',
    info: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  };

  const iconStyles = {
    warning: 'text-amber-600',
    danger: 'text-red-600',
    info: 'text-blue-600',
  };

  const countStyles = {
    warning: 'bg-amber-600',
    danger: 'bg-red-600',
    info: 'bg-blue-600',
  };

  return (
    <button
      onClick={() => router.push(link)}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left',
        variantStyles[variant]
      )}
    >
      <div className={cn('flex-shrink-0', iconStyles[variant])}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('px-2 py-0.5 text-xs font-bold text-white rounded-full', countStyles[variant])}>
            {count}
          </span>
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
    </button>
  );
}

export function AlertsPanel({ alerts, loading }: AlertsPanelProps) {
  const hasAlerts = alerts && (
    alerts.delayed.count > 0 ||
    alerts.overdue.count > 0 ||
    alerts.unassigned.count > 0
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">გაფრთხილებები</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!hasAlerts) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">გაფრთხილებები</h3>
        </div>
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">ყველაფერი წესრიგშია!</p>
          <p className="text-xs text-gray-400 mt-1">გაფრთხილებები არ არის</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">გაფრთხილებები</h3>
        <span className="text-xs text-gray-400">საჭიროებს ყურადღებას</span>
      </div>

      <div className="space-y-3">
        <AlertRow
          icon={<AlertTriangle className="h-5 w-5" />}
          count={alerts.delayed.count}
          title="შეფერხებული ქეისები"
          description="ქეისები რომლებიც საჭიროებენ ყურადღებას"
          link="/cases?status=delayed"
          variant="danger"
        />

        <AlertRow
          icon={<Clock className="h-5 w-5" />}
          count={alerts.overdue.count}
          title="ვადაგადაცილებული ინვოისები"
          description="გადაუხდელი >30 დღე"
          link="/invoices?status=unpaid"
          variant="warning"
        />

        <AlertRow
          icon={<UserX className="h-5 w-5" />}
          count={alerts.unassigned.count}
          title="დაუნიშნავი ქეისები"
          description="საჭიროებს ასისტანტის მინიჭებას"
          link="/cases"
          variant="info"
        />
      </div>
    </div>
  );
}

export default AlertsPanel;
