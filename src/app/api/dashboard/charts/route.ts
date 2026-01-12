import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ChartDataPoint {
  date: string;
  label: string;
  opened: number;
  completed: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

interface ChartsResponse {
  casesOverTime: ChartDataPoint[];
  statusBreakdown: StatusBreakdown[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Get date range and grouping
    const { startDate, groupBy, labels } = getDateRangeConfig(period);

    // Fetch cases for the period
    const { data: cases } = await supabase
      .from('cases')
      .select('id, status, created_at, closed_at')
      .is('deleted_at', null)
      .gte('created_at', startDate.toISOString());

    // Process cases over time
    const casesOverTime = processTimeSeriesData(cases || [], labels, groupBy);

    // Get status breakdown (all active cases)
    const { data: allCases } = await supabase
      .from('cases')
      .select('status')
      .is('deleted_at', null);

    const statusBreakdown = processStatusBreakdown(allCases || []);

    const response: ChartsResponse = {
      casesOverTime,
      statusBreakdown,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Dashboard charts error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch charts' } },
      { status: 500 }
    );
  }
}

function getDateRangeConfig(period: string): { startDate: Date; groupBy: string; labels: string[] } {
  const now = new Date();
  const labels: string[] = [];
  let startDate: Date;
  let groupBy: string;

  switch (period) {
    case 'week': {
      // Last 7 days
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      groupBy = 'day';
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        labels.push(d.toISOString().split('T')[0]);
      }
      break;
    }
    case 'month': {
      // Current month days
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      groupBy = 'day';
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), i);
        labels.push(d.toISOString().split('T')[0]);
      }
      break;
    }
    case 'quarter': {
      // Last 12 weeks
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 84); // ~12 weeks
      startDate.setHours(0, 0, 0, 0);
      groupBy = 'week';
      for (let i = 0; i < 12; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i * 7);
        labels.push(d.toISOString().split('T')[0]);
      }
      break;
    }
    case 'year':
    default: {
      // Last 12 months
      startDate = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
      groupBy = 'month';
      for (let i = 0; i < 12; i++) {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + i);
        labels.push(d.toISOString().slice(0, 7)); // YYYY-MM format
      }
      break;
    }
  }

  return { startDate, groupBy, labels };
}

function processTimeSeriesData(
  cases: Array<{ id: string; status: string; created_at: string; closed_at: string | null }>,
  labels: string[],
  groupBy: string
): ChartDataPoint[] {
  const dataMap = new Map<string, { opened: number; completed: number }>();

  // Initialize all labels with zero values
  labels.forEach(label => {
    dataMap.set(label, { opened: 0, completed: 0 });
  });

  // Process cases
  cases.forEach(caseItem => {
    const createdDate = new Date(caseItem.created_at);
    const createdKey = getDateKey(createdDate, groupBy);
    
    if (dataMap.has(createdKey)) {
      const current = dataMap.get(createdKey)!;
      current.opened++;
    }

    if (caseItem.closed_at && caseItem.status === 'completed') {
      const closedDate = new Date(caseItem.closed_at);
      const closedKey = getDateKey(closedDate, groupBy);
      
      if (dataMap.has(closedKey)) {
        const current = dataMap.get(closedKey)!;
        current.completed++;
      }
    }
  });

  // Convert to array
  return labels.map(label => ({
    date: label,
    label: formatLabel(label, groupBy),
    opened: dataMap.get(label)?.opened || 0,
    completed: dataMap.get(label)?.completed || 0,
  }));
}

function getDateKey(date: Date, groupBy: string): string {
  switch (groupBy) {
    case 'day':
      return date.toISOString().split('T')[0];
    case 'week': {
      // Get start of week
      const d = new Date(date);
      d.setDate(d.getDate() - d.getDay());
      return d.toISOString().split('T')[0];
    }
    case 'month':
      return date.toISOString().slice(0, 7);
    default:
      return date.toISOString().split('T')[0];
  }
}

function formatLabel(label: string, groupBy: string): string {
  const date = new Date(label);
  switch (groupBy) {
    case 'day':
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    case 'week':
      return `W${getWeekNumber(date)}`;
    case 'month':
      return date.toLocaleDateString('en-US', { month: 'short' });
    default:
      return label;
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function processStatusBreakdown(cases: Array<{ status: string }>): StatusBreakdown[] {
  const statusCounts = new Map<string, number>();
  const statuses = ['draft', 'in_progress', 'paused', 'delayed', 'completed', 'cancelled'];

  // Initialize all statuses
  statuses.forEach(s => statusCounts.set(s, 0));

  // Count cases by status
  cases.forEach(c => {
    const current = statusCounts.get(c.status) || 0;
    statusCounts.set(c.status, current + 1);
  });

  const total = cases.length || 1;

  return statuses.map(status => ({
    status,
    count: statusCounts.get(status) || 0,
    percentage: Math.round(((statusCounts.get(status) || 0) / total) * 100),
  }));
}
