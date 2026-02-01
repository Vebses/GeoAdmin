import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type CurrencyCode = 'GEL' | 'USD' | 'EUR';

interface CurrencyAmount {
  currency: CurrencyCode;
  amount: number;
}

interface StatsResponse {
  totalCases: number;
  totalCasesChange: number;
  activeCases: number;
  activeCasesChange: number;
  completedThisMonth: number;
  completedChange: number;
  unpaidInvoices: number;
  unpaidInvoicesAmount: number;
  unpaidByCurrency: CurrencyAmount[];
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

    // Unpaid invoices with currency
    const { data: unpaidData } = await supabase
      .from('invoices')
      .select('total, currency')
      .is('deleted_at', null)
      .eq('status', 'unpaid');

    const unpaidInvoices = unpaidData?.length || 0;

    // Group by currency
    const currencyTotals: Record<CurrencyCode, number> = { GEL: 0, USD: 0, EUR: 0 };
    let unpaidInvoicesAmount = 0;

    for (const inv of (unpaidData || []) as { total: number | null; currency?: CurrencyCode }[]) {
      const amount = inv.total || 0;
      const currency = (inv.currency || 'EUR') as CurrencyCode;
      currencyTotals[currency] += amount;
      unpaidInvoicesAmount += amount;
    }

    const unpaidByCurrency: CurrencyAmount[] = (Object.entries(currencyTotals) as [CurrencyCode, number][])
      .filter(([_, amount]) => amount > 0)
      .map(([currency, amount]) => ({ currency, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Calculate percentage changes
    const totalCasesChange = calculatePercentChange(totalCasesPrevious || 0, totalCases || 0);
    const activeCasesChange = calculatePercentChange(activeCasesPrevious || 0, activeCases || 0);
    const completedChange = calculatePercentChange(completedLastMonth || 0, completedThisMonth || 0);

    const stats: StatsResponse = {
      totalCases: totalCases || 0,
      totalCasesChange,
      activeCases: activeCases || 0,
      activeCasesChange,
      completedThisMonth: completedThisMonth || 0,
      completedChange,
      unpaidInvoices,
      unpaidInvoicesAmount,
      unpaidByCurrency,
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch stats' } },
      { status: 500 }
    );
  }
}

function getPeriodStart(date: Date, period: string): Date {
  const d = new Date(date);
  switch (period) {
    case 'week':
      d.setDate(d.getDate() - d.getDay()); // Start of week (Sunday)
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
