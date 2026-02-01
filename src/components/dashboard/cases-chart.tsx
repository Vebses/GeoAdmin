'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import type { ChartDataPoint } from '@/hooks/use-dashboard';

interface CasesChartProps {
  data: ChartDataPoint[] | undefined;
  loading?: boolean;
}

export function CasesChart({ data, loading = false }: CasesChartProps) {
  // Limit data points for readability
  const chartData = useMemo(() => {
    if (!data) return [];
    // Show max 15 data points for readability
    if (data.length <= 15) return data;
    const step = Math.ceil(data.length / 15);
    return data.filter((_, i) => i % step === 0);
  }, [data]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="p-5">
          <Skeleton className="h-[280px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-50">
        <h3 className="text-sm font-semibold text-gray-900">
          ქეისები პერიოდის მიხედვით
        </h3>
      </div>

      {/* Chart */}
      <div className="p-5">
        {chartData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
            მონაცემები არ მოიძებნა
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                  fontSize: '12px',
                  padding: '12px 16px',
                }}
                labelStyle={{ fontWeight: 600, marginBottom: '8px', color: '#111827' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
                iconType="circle"
                iconSize={8}
              />
              <Line
                type="monotone"
                dataKey="opened"
                name="გახსნილი"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
              />
              <Line
                type="monotone"
                dataKey="completed"
                name="დასრულებული"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default CasesChart;
