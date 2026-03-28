import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/sidebar-counts - Get counts for sidebar badges
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Run all count queries in parallel for performance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [
      { count: activeCases },
      { count: unpaidInvoices },
      { count: trashedCases },
      { count: trashedInvoices },
      { count: trashedPartners },
    ] = await Promise.all([
      // Active cases (not completed or cancelled)
      (supabase.from('cases') as any)
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
        .not('status', 'in', '("completed","cancelled")'),
      // Unpaid invoices
      (supabase.from('invoices') as any)
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
        .in('status', ['draft', 'unpaid']),
      // Trashed cases
      (supabase.from('cases') as any)
        .select('*', { count: 'exact', head: true })
        .not('deleted_at', 'is', null),
      // Trashed invoices
      (supabase.from('invoices') as any)
        .select('*', { count: 'exact', head: true })
        .not('deleted_at', 'is', null),
      // Trashed partners
      (supabase.from('partners') as any)
        .select('*', { count: 'exact', head: true })
        .not('deleted_at', 'is', null),
    ]);

    const trashedItems = (trashedCases || 0) + (trashedInvoices || 0) + (trashedPartners || 0);

    return NextResponse.json({
      success: true,
      data: {
        activeCases: activeCases || 0,
        unpaidInvoices: unpaidInvoices || 0,
        trashedItems,
      },
    });
  } catch (error) {
    console.error('Sidebar counts error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch counts' } },
      { status: 500 }
    );
  }
}
