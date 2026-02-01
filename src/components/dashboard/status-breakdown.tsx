'use client';

import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { StatusBreakdown as StatusBreakdownType } from '@/hooks/use-dashboard';

interface StatusBreakdownProps {
  data: StatusBreakdownType[] | undefined;
  loading?: boolean;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'დრაფტი', color: '#6b7280' },
  in_progress: { label: 'მიმდინარე', color: '#3b82f6' },
  paused: { label: 'შეჩერებული', color: '#f59e0b' },
  delayed: { label: 'დაგვიანებული', color: '#ef4444' },
  completed: { label: 'დასრულებული', color: '#22c55e' },
  cancelled: { label: 'გაუქმებული', color: '#9ca3af' },
};

export function StatusBreakdown({ data, loading = false }: StatusBreakdownProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="p-5">
          <div className="flex items-center gap-6">
            <Skeleton className="h-[200px] w-[200px] rounded-full" />
            <div className="flex-1 space-y-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const chartData = data?.map(item => ({
    ...item,
    name: statusConfig[item.status]?.label || item.status,
    fill: statusConfig[item.status]?.color || '#6b7280',
  })) || [];

  const totalCases = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-50">
        <h3 className="text-sm font-semibold text-gray-900">
          სტატუსების განაწილება
        </h3>
      </div>

      {/* Content */}
      <div className="p-5">
        {totalCases === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
            მონაცემები არ მოიძებნა
          </div>
        ) : (
          <div className="flex items-center gap-6">
            {/* Pie Chart */}
            <div className="w-[180px] h-[180px] flex-shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="count"
                    strokeWidth={0}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border-none rounded-xl shadow-lg p-3 text-xs">
                            <p className="font-semibold text-gray-900">{data.name}</p>
                            <p className="text-gray-500 mt-1">{data.count} ქეისი ({data.percentage}%)</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center total */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{totalCases}</p>
                  <p className="text-xs text-gray-500">სულ</p>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-1.5">
              {chartData.map((item) => (
                <button
                  key={item.status}
                  onClick={() => router.push(`/cases?status=${item.status}`)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">
                      {item.count}
                    </span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      item.percentage > 0 ? 'bg-gray-100 text-gray-600' : 'text-gray-400'
                    )}>
                      {item.percentage}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StatusBreakdown;
