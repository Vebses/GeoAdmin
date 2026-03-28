import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isAuthError, ADMIN_ROLES } from '@/lib/auth-utils';

interface AlertItem {
  id: string;
  title: string;
  subtitle?: string;
  link: string;
}

interface AlertsResponse {
  delayed: {
    count: number;
    items: AlertItem[];
  };
  overdue: {
    count: number;
    items: AlertItem[];
  };
  unassigned: {
    count: number;
    items: AlertItem[];
  };
}

interface CaseRow {
  id: string;
  case_number: string;
  patient_name: string;
}

interface InvoiceRow {
  id: string;
  invoice_number: string;
  total: number;
  currency: string;
  created_at: string;
}

export async function GET() {
  try {
    const auth = await requireAuth(ADMIN_ROLES);
    if (isAuthError(auth)) return auth.response;

    const supabase = await createClient();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Run all alert queries in parallel
    const [
      { data: delayedCases, count: delayedCount },
      { data: overdueInvoices, count: overdueCount },
      { data: unassignedCases, count: unassignedCount },
    ] = await Promise.all([
      // Delayed cases
      supabase
        .from('cases')
        .select('id, case_number, patient_name', { count: 'exact' })
        .is('deleted_at', null)
        .eq('status', 'delayed')
        .order('opened_at', { ascending: false })
        .limit(5),
      // Overdue invoices (unpaid > 30 days)
      supabase
        .from('invoices')
        .select('id, invoice_number, total, currency, created_at', { count: 'exact' })
        .is('deleted_at', null)
        .eq('status', 'unpaid')
        .lt('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true })
        .limit(5),
      // Unassigned cases
      supabase
        .from('cases')
        .select('id, case_number, patient_name', { count: 'exact' })
        .is('deleted_at', null)
        .is('assigned_to', null)
        .in('status', ['draft', 'in_progress'])
        .order('opened_at', { ascending: false })
        .limit(5),
    ]);

    const alerts: AlertsResponse = {
      delayed: {
        count: delayedCount || 0,
        items: ((delayedCases || []) as CaseRow[]).map(c => ({
          id: c.id,
          title: c.case_number,
          subtitle: c.patient_name,
          link: `/cases?status=delayed`,
        })),
      },
      overdue: {
        count: overdueCount || 0,
        items: ((overdueInvoices || []) as InvoiceRow[]).map(inv => ({
          id: inv.id,
          title: inv.invoice_number,
          subtitle: `${inv.total} ${inv.currency}`,
          link: `/invoices?status=unpaid`,
        })),
      },
      unassigned: {
        count: unassignedCount || 0,
        items: ((unassignedCases || []) as CaseRow[]).map(c => ({
          id: c.id,
          title: c.case_number,
          subtitle: c.patient_name,
          link: `/cases`,
        })),
      },
    };

    return NextResponse.json({ success: true, data: alerts });
  } catch (error) {
    console.error('Dashboard alerts error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch alerts' } },
      { status: 500 }
    );
  }
}
