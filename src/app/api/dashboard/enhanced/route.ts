import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isAuthError, ADMIN_ROLES } from '@/lib/auth-utils';

type CurrencyCode = 'GEL' | 'USD' | 'EUR';

interface CurrencyAmount {
  currency: CurrencyCode;
  amount: number;
}

// Per-currency financial breakdown
interface CurrencyFinancialRow {
  currency: CurrencyCode;
  revenue: number;       // Paid in this period
  outstanding: number;   // Unpaid total
  invoiceCount: number;  // Total invoices in this currency
  unpaidCount: number;   // Unpaid invoices count
}

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
    // Legacy format for backwards compatibility
    revenue: CurrencyAmount[];
    revenueTotal: number;
    revenueChange: number;
    outstanding: CurrencyAmount[];
    outstandingTotal: number;
    outstandingCount: number;
    overdueCount: number;
    avgCaseValue: CurrencyAmount[];
    collectionRate: number;
    // New: Per-currency breakdown table
    byCurrency: CurrencyFinancialRow[];
  };
}

interface InvoiceRow {
  total: number | null;
  paid_amount?: number | null;
  currency?: CurrencyCode;
  created_at?: string;
}

// Group invoice amounts by currency
function groupByCurrency(
  data: InvoiceRow[] | null,
  primaryField: 'paid_amount' | 'total'
): { amounts: CurrencyAmount[]; total: number } {
  if (!data || data.length === 0) {
    return { amounts: [], total: 0 };
  }

  const grouped: Record<CurrencyCode, number> = { GEL: 0, USD: 0, EUR: 0 };
  let total = 0;

  for (const inv of data) {
    const currency = (inv.currency || 'EUR') as CurrencyCode;
    const amount = (primaryField === 'paid_amount' ? (inv.paid_amount || inv.total) : inv.total) || 0;
    grouped[currency] += amount;
    total += amount;
  }

  // Return only non-zero currencies, sorted by amount descending
  const amounts = (Object.entries(grouped) as [CurrencyCode, number][])
    .filter(([_, amount]) => amount > 0)
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => b.amount - a.amount);

  return { amounts, total };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(ADMIN_ROLES);
    if (isAuthError(auth)) return auth.response;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    const supabase = await createClient();

    // Calculate date ranges
    const now = new Date();
    const currentPeriodStart = getPeriodStart(now, period);
    const previousPeriodStart = getPreviousPeriodStart(now, period);
    const previousPeriodEnd = currentPeriodStart;
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // ============ RUN ALL QUERIES IN PARALLEL ============
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = monthStart;

    const [
      { count: totalCases },
      { count: totalCasesPrevious },
      { count: activeCases },
      { count: activeCasesPrevious },
      { count: delayedCases },
      { count: unassignedCases },
      { count: completedThisMonth },
      { count: completedLastMonth },
      { count: totalCompletedCases },
      { data: paidData },
      { data: paidDataPrevious },
      { data: unpaidData },
      { data: allInvoicesData },
    ] = await Promise.all([
      // Operational metrics
      supabase.from('cases').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('cases').select('*', { count: 'exact', head: true }).is('deleted_at', null).lt('created_at', previousPeriodEnd.toISOString()),
      supabase.from('cases').select('*', { count: 'exact', head: true }).is('deleted_at', null).in('status', ['draft', 'in_progress', 'paused', 'delayed']),
      supabase.from('cases').select('*', { count: 'exact', head: true }).is('deleted_at', null).in('status', ['draft', 'in_progress', 'paused', 'delayed']).lt('created_at', previousPeriodEnd.toISOString()),
      supabase.from('cases').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'delayed'),
      supabase.from('cases').select('*', { count: 'exact', head: true }).is('deleted_at', null).is('assigned_to', null).in('status', ['draft', 'in_progress']),
      supabase.from('cases').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'completed').gte('closed_at', monthStart.toISOString()),
      supabase.from('cases').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'completed').gte('closed_at', lastMonthStart.toISOString()).lt('closed_at', lastMonthEnd.toISOString()),
      supabase.from('cases').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'completed'),
      // Financial metrics
      supabase.from('invoices').select('total, paid_amount, currency').is('deleted_at', null).eq('status', 'paid').gte('paid_at', currentPeriodStart.toISOString()),
      supabase.from('invoices').select('total, paid_amount, currency').is('deleted_at', null).eq('status', 'paid').gte('paid_at', previousPeriodStart.toISOString()).lt('paid_at', previousPeriodEnd.toISOString()),
      supabase.from('invoices').select('total, currency, created_at').is('deleted_at', null).eq('status', 'unpaid'),
      // All invoices for per-currency breakdown
      supabase.from('invoices').select('total, paid_amount, currency, status').is('deleted_at', null),
    ]);

    const revenueGrouped = groupByCurrency(paidData as InvoiceRow[], 'paid_amount');
    const revenuePreviousGrouped = groupByCurrency(paidDataPrevious as InvoiceRow[], 'paid_amount');

    const unpaidTyped = (unpaidData || []) as InvoiceRow[];
    const outstandingGrouped = groupByCurrency(unpaidTyped, 'total');
    const outstandingCount = unpaidTyped.length;

    // Overdue invoices (unpaid > 30 days)
    const overdueCount = unpaidTyped.filter(inv =>
      inv.created_at && new Date(inv.created_at) < thirtyDaysAgo
    ).length;

    // All-time revenue from allInvoicesData (paid invoices)
    interface AllInvoiceRow {
      total: number | null;
      paid_amount: number | null;
      currency: CurrencyCode | null;
      status: string | null;
    }

    const allInvoices = (allInvoicesData || []) as AllInvoiceRow[];
    const allPaidInvoices = allInvoices.filter(inv => inv.status === 'paid') as InvoiceRow[];
    const allTimeRevenueGrouped = groupByCurrency(allPaidInvoices, 'paid_amount');

    // Calculate avg case value per currency
    const avgCaseValueByCurrency: CurrencyAmount[] = totalCompletedCases && totalCompletedCases > 0
      ? allTimeRevenueGrouped.amounts.map(c => ({
          currency: c.currency,
          amount: Math.round(c.amount / totalCompletedCases)
        }))
      : [];

    // Collection rate (paid / (paid + unpaid)) - using totals
    const totalInvoiced = allTimeRevenueGrouped.total + outstandingGrouped.total;
    const collectionRate = totalInvoiced > 0
      ? Math.round((allTimeRevenueGrouped.total / totalInvoiced) * 100)
      : 0;

    const currencies: CurrencyCode[] = ['GEL', 'USD', 'EUR'];
    const byCurrency: CurrencyFinancialRow[] = currencies.map(currency => {
      const currencyInvoices = allInvoices.filter(
        inv => (inv.currency || 'EUR') === currency
      );
      const paidInvoices = currencyInvoices.filter(inv => inv.status === 'paid');
      const unpaidInvoices = currencyInvoices.filter(inv => inv.status === 'unpaid');

      // Revenue = all-time paid amount for this currency (not period-limited)
      const allTimeRevenue = paidInvoices.reduce(
        (sum, inv) => sum + (inv.paid_amount || inv.total || 0),
        0
      );

      return {
        currency,
        revenue: allTimeRevenue,
        outstanding: unpaidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
        invoiceCount: currencyInvoices.length,
        unpaidCount: unpaidInvoices.length,
      };
    }).filter(row => row.invoiceCount > 0 || row.revenue > 0 || row.outstanding > 0);

    // Calculate percentage changes
    const totalCasesChange = calculatePercentChange(totalCasesPrevious || 0, totalCases || 0);
    const activeCasesChange = calculatePercentChange(activeCasesPrevious || 0, activeCases || 0);
    const completedChange = calculatePercentChange(completedLastMonth || 0, completedThisMonth || 0);
    const revenueChange = calculatePercentChange(revenuePreviousGrouped.total, revenueGrouped.total);

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
        revenue: revenueGrouped.amounts,
        revenueTotal: revenueGrouped.total,
        revenueChange,
        outstanding: outstandingGrouped.amounts,
        outstandingTotal: outstandingGrouped.total,
        outstandingCount,
        overdueCount,
        avgCaseValue: avgCaseValueByCurrency,
        collectionRate,
        byCurrency,
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
