import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isAuthError } from '@/lib/auth-utils';

type CurrencyCode = 'GEL' | 'USD' | 'EUR';

interface CurrencyAmount {
  currency: CurrencyCode;
  amount: number;
}

interface PartnerStatsResponse {
  casesCount: number;
  invoicesCount: number;
  invoicesByStatus: {
    draft: number;
    unpaid: number;
    paid: number;
    cancelled: number;
  };
  totalByCurrency: CurrencyAmount[];
  paidByCurrency: CurrencyAmount[];
  outstandingByCurrency: CurrencyAmount[];
}

// GET /api/partners/[id]/stats — real-time stats for a partner, grouped by currency
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth.response;

    const { id } = await params;
    const supabase = await createClient();

    // Run all queries in parallel; all exclude soft-deleted
    const [
      { count: casesAsClient },
      { count: casesAsInsurance },
      { count: casesAsExecutor },
      { data: invoicesData },
    ] = await Promise.all([
      // Cases where this partner is the client
      supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
        .eq('client_id', id),
      // Cases where this partner is the insurance
      supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
        .eq('insurance_id', id),
      // Distinct cases where this partner executed actions
      supabase
        .from('case_actions')
        .select('case_id', { count: 'exact', head: true })
        .eq('executor_id', id),
      // All active invoices (either as recipient)
      supabase
        .from('invoices')
        .select('total, paid_amount, currency, status')
        .is('deleted_at', null)
        .eq('recipient_id', id),
    ]);

    const casesCount = (casesAsClient || 0) + (casesAsInsurance || 0) + (casesAsExecutor || 0);

    // Group invoices by currency and status
    const invoices = (invoicesData || []) as Array<{
      total: number | null;
      paid_amount: number | null;
      currency: CurrencyCode | null;
      status: string | null;
    }>;

    const invoicesByStatus = {
      draft: 0,
      unpaid: 0,
      paid: 0,
      cancelled: 0,
    };

    const totalByCcy: Record<CurrencyCode, number> = { GEL: 0, USD: 0, EUR: 0 };
    const paidByCcy: Record<CurrencyCode, number> = { GEL: 0, USD: 0, EUR: 0 };
    const outstandingByCcy: Record<CurrencyCode, number> = { GEL: 0, USD: 0, EUR: 0 };

    for (const inv of invoices) {
      const currency = (inv.currency || 'EUR') as CurrencyCode;
      const total = inv.total || 0;
      const paid = inv.paid_amount || 0;

      totalByCcy[currency] += total;

      if (inv.status === 'paid') {
        invoicesByStatus.paid += 1;
        paidByCcy[currency] += paid || total;
      } else if (inv.status === 'unpaid') {
        invoicesByStatus.unpaid += 1;
        outstandingByCcy[currency] += total;
      } else if (inv.status === 'draft') {
        invoicesByStatus.draft += 1;
      } else if (inv.status === 'cancelled') {
        invoicesByStatus.cancelled += 1;
      }
    }

    const toArray = (rec: Record<CurrencyCode, number>): CurrencyAmount[] =>
      (Object.entries(rec) as [CurrencyCode, number][])
        .filter(([, amount]) => amount > 0)
        .map(([currency, amount]) => ({ currency, amount }))
        .sort((a, b) => b.amount - a.amount);

    const stats: PartnerStatsResponse = {
      casesCount,
      invoicesCount: invoices.length,
      invoicesByStatus,
      totalByCurrency: toArray(totalByCcy),
      paidByCurrency: toArray(paidByCcy),
      outstandingByCurrency: toArray(outstandingByCcy),
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Partner stats error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სტატისტიკის ჩატვირთვა ვერ მოხერხდა' } },
      { status: 500 }
    );
  }
}
