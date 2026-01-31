import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface EnhancedStatsResponse {
  operational: {
    totalCases: number;
    totalCasesChange: number;
    activeCases: number;
    activeCasesChange: number;
    delayedCases: number;
    completedThisMonth: number;
    completedChange: number;
    unassignedCases: number;
  };
  financial: {
    revenue: number;
    revenueChange: number;
    outstanding: number;
    outstandingCount: number;
    overdueCount: number;
    avgCaseValue: number;
    collectionRate: number;
  };
}

interface InvoiceRow {
  total: number | null;
  paid_amount?: number | null;
  created_at?: string;
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

    // Calculate date ranges
    const now = new Date();
    const currentPeriodStart = getPeriodStart(now, period);
    const previousPeriodStart = getPreviousPeriodStart(now, period);
    const previousPeriodEnd = currentPeriodStart;
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // ============ OPERATIONAL METRICS ============

    // Total Cases
    const { count: totalCases } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);

    // Total Cases in previous period
    const { count: totalCasesPrevious } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .lt('created_at', previousPeriodEnd.toISOString());

    // Active Cases (draft, in_progress, paused, delayed)
    const { count: activeCases } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .in('status', ['draft', 'in_progress', 'paused', 'delayed']);

    // Active Cases in previous period
    const { count: activeCasesPrevious } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .in('status', ['draft', 'in_progress', 'paused', 'delayed'])
      .lt('created_at', previousPeriodEnd.toISOString());

    // Delayed Cases (warning indicator)
    const { count: delayedCases } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('status', 'delayed');

    // Unassigned Cases (need attention)
    const { count: unassignedCases } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .is('assigned_to', null)
      .in('status', ['draft', 'in_progress']);

    // Completed this month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const { count: completedThisMonth } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('status', 'completed')
      .gte('closed_at', monthStart.toISOString());

    // Completed last month (for comparison)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = monthStart;
    const { count: completedLastMonth } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('status', 'completed')
      .gte('closed_at', lastMonthStart.toISOString())
      .lt('closed_at', lastMonthEnd.toISOString());

    // ============ FINANCIAL METRICS ============

    // Revenue (paid invoices in current period)
    const { data: paidData } = await supabase
      .from('invoices')
      .select('total, paid_amount')
      .is('deleted_at', null)
      .eq('status', 'paid')
      .gte('paid_at', currentPeriodStart.toISOString());

    const revenue = ((paidData || []) as InvoiceRow[]).reduce((sum, inv) => sum + (inv.paid_amount || inv.total || 0), 0);

    // Revenue in previous period
    const { data: paidDataPrevious } = await supabase
      .from('invoices')
      .select('total, paid_amount')
      .is('deleted_at', null)
      .eq('status', 'paid')
      .gte('paid_at', previousPeriodStart.toISOString())
      .lt('paid_at', previousPeriodEnd.toISOString());

    const revenuePrevious = ((paidDataPrevious || []) as InvoiceRow[]).reduce((sum, inv) => sum + (inv.paid_amount || inv.total || 0), 0);

    // Outstanding (unpaid invoices)
    const { data: unpaidData } = await supabase
      .from('invoices')
      .select('total, created_at')
      .is('deleted_at', null)
      .eq('status', 'unpaid');

    const unpaidTyped = (unpaidData || []) as InvoiceRow[];
    const outstanding = unpaidTyped.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const outstandingCount = unpaidTyped.length;

    // Overdue invoices (unpaid > 30 days)
    const overdueCount = unpaidTyped.filter(inv =>
      inv.created_at && new Date(inv.created_at) < thirtyDaysAgo
    ).length;

    // Average case value (revenue per completed case)
    const { count: totalCompletedCases } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('status', 'completed');

    // Total revenue (all time)
    const { data: allPaidData } = await supabase
      .from('invoices')
      .select('total, paid_amount')
      .is('deleted_at', null)
      .eq('status', 'paid');

    const totalRevenue = ((allPaidData || []) as InvoiceRow[]).reduce((sum, inv) => sum + (inv.paid_amount || inv.total || 0), 0);
    const avgCaseValue = totalCompletedCases && totalCompletedCases > 0
      ? Math.round(totalRevenue / totalCompletedCases)
      : 0;

    // Collection rate (paid / (paid + unpaid))
    const totalInvoiced = totalRevenue + outstanding;
    const collectionRate = totalInvoiced > 0
      ? Math.round((totalRevenue / totalInvoiced) * 100)
      : 0;

    // Calculate percentage changes
    const totalCasesChange = calculatePercentChange(totalCasesPrevious || 0, totalCases || 0);
    const activeCasesChange = calculatePercentChange(activeCasesPrevious || 0, activeCases || 0);
    const completedChange = calculatePercentChange(completedLastMonth || 0, completedThisMonth || 0);
    const revenueChange = calculatePercentChange(revenuePrevious, revenue);

    const stats: EnhancedStatsResponse = {
      operational: {
        totalCases: totalCases || 0,
        totalCasesChange,
        activeCases: activeCases || 0,
        activeCasesChange,
        delayedCases: delayedCases || 0,
        completedThisMonth: completedThisMonth || 0,
        completedChange,
        unassignedCases: unassignedCases || 0,
      },
      financial: {
        revenue,
        revenueChange,
        outstanding,
        outstandingCount,
        overdueCount,
        avgCaseValue,
        collectionRate,
      },
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Dashboard enhanced stats error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch enhanced stats' } },
      { status: 500 }
    );
  }
}

function getPeriodStart(date: Date, period: string): Date {
  const d = new Date(date);
  switch (period) {
    case 'week':
      d.setDate(d.getDate() - d.getDay());
      break;
    case 'month':
      d.setDate(1);
      break;
    case 'quarter':
      d.setMonth(Math.floor(d.getMonth() / 3) * 3, 1);
      break;
    case 'year':
      d.setMonth(0, 1);
      break;
  }
  d.setHours(0, 0, 0, 0);
  return d;
}

function getPreviousPeriodStart(date: Date, period: string): Date {
  const d = getPeriodStart(date, period);
  switch (period) {
    case 'week':
      d.setDate(d.getDate() - 7);
      break;
    case 'month':
      d.setMonth(d.getMonth() - 1);
      break;
    case 'quarter':
      d.setMonth(d.getMonth() - 3);
      break;
    case 'year':
      d.setFullYear(d.getFullYear() - 1);
      break;
  }
  return d;
}

function calculatePercentChange(previous: number, current: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
