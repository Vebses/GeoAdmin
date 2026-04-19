import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Roles that can manage trash
const ADMIN_ROLES = ['super_admin', 'manager'];

// POST /api/trash/empty - Empty all trash
export async function POST() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Check user role (only admin/manager can empty trash)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData } = await (supabase
      .from('users') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !ADMIN_ROLES.includes(userData.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'მხოლოდ ადმინისტრატორებს შეუძლიათ ნაგვის დაცლა' } },
        { status: 403 }
      );
    }

    // Get all trashed items
    const [
      { data: trashedCases },
      { data: trashedInvoices },
    ] = await Promise.all([
      supabase
        .from('cases')
        .select('id')
        .not('deleted_at', 'is', null),
      supabase
        .from('invoices')
        .select('id')
        .not('deleted_at', 'is', null),
    ]);

    // Delete case-related records first (case_actions, case_documents)
    if (trashedCases && trashedCases.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const caseIds = (trashedCases as any[]).map(c => c.id);

      await Promise.all([
        supabase.from('case_actions').delete().in('case_id', caseIds),
        supabase.from('case_documents').delete().in('case_id', caseIds),
      ]);
    }

    // Delete invoice-related records first (invoice_services, invoice_sends)
    if (trashedInvoices && trashedInvoices.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invoiceIds = (trashedInvoices as any[]).map(i => i.id);

      await Promise.all([
        supabase.from('invoice_services').delete().in('invoice_id', invoiceIds),
        supabase.from('invoice_sends').delete().in('invoice_id', invoiceIds),
      ]);
    }

    // Permanently delete all trashed items in parallel
    await Promise.all([
      supabase.from('cases').delete().not('deleted_at', 'is', null),
      supabase.from('invoices').delete().not('deleted_at', 'is', null),
      supabase.from('partners').delete().not('deleted_at', 'is', null),
      supabase.from('our_companies').delete().not('deleted_at', 'is', null),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        deleted_cases: trashedCases?.length || 0,
        deleted_invoices: trashedInvoices?.length || 0,
      },
    });
  } catch (error) {
    console.error('Empty trash error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to empty trash' } },
      { status: 500 }
    );
  }
}
