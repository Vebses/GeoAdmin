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
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        ქეისები პერიოდის მიხედვით
      </h3>

      {chartData.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
          მონაცემები არ მოიძებნა
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            />
            <Line
              type="monotone"
              dataKey="opened"
              name="გახსნილი"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3, fill: '#3b82f6' }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="completed"
              name="დასრულებული"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 3, fill: '#22c55e' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default CasesChart;
