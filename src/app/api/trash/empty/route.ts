import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity-logs';
import { extractStoragePath } from '@/lib/storage-urls';

// Roles that can manage trash
const ADMIN_ROLES = ['super_admin', 'manager'];
const CONFIRM_PHRASE = 'EMPTY_TRASH';

// POST /api/trash/empty - Empty all trash
// Requires header `x-delete-confirmation: EMPTY_TRASH`
export async function POST(request: NextRequest) {
  try {
    const confirmHeader = request.headers.get('x-delete-confirmation') || '';
    if (confirmHeader !== CONFIRM_PHRASE) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFIRMATION_REQUIRED', message: 'დადასტურება საჭიროა' } },
        { status: 400 }
      );
    }

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

    // Snapshot the IDs currently in trash so we delete a BOUNDED set (no TOCTOU
    // where a row trashed mid-operation gets a parent deleted but not its children).
    const [
      { data: trashedCasesRaw },
      { data: trashedInvoicesRaw },
      { data: trashedPartnersRaw },
      { data: trashedCompaniesRaw },
    ] = await Promise.all([
      supabase.from('cases').select('id').not('deleted_at', 'is', null),
      supabase.from('invoices').select('id').not('deleted_at', 'is', null),
      supabase.from('partners').select('id').not('deleted_at', 'is', null),
      supabase.from('our_companies').select('id').not('deleted_at', 'is', null),
    ]);

    const allCaseIds = ((trashedCasesRaw as { id: string }[]) || []).map((c) => c.id);
    const invoiceIds = ((trashedInvoicesRaw as { id: string }[]) || []).map((i) => i.id);
    const partnerIds = ((trashedPartnersRaw as { id: string }[]) || []).map((p) => p.id);
    const companyIds = ((trashedCompaniesRaw as { id: string }[]) || []).map((c) => c.id);

    // Don't purge a case that still has a LIVE (non-deleted) invoice — the case
    // delete CASCADEs to invoices and would destroy live/paid financial records.
    let blockedCaseIds: string[] = [];
    if (allCaseIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: liveInv } = await (supabase.from('invoices') as any)
        .select('case_id')
        .is('deleted_at', null)
        .in('case_id', allCaseIds);
      blockedCaseIds = Array.from(
        new Set(((liveInv as { case_id: string }[]) || []).map((r) => r.case_id))
      );
    }
    const caseIds = allCaseIds.filter((cid) => !blockedCaseIds.includes(cid));

    // Remove case document files from Storage before deleting rows (avoid orphaned PII files)
    if (caseIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: docRows } = await (supabase.from('case_documents') as any)
        .select('file_url')
        .in('case_id', caseIds);
      const docPaths = ((docRows as { file_url: string | null }[]) || [])
        .map((d) => extractStoragePath(d.file_url))
        .filter((p): p is string => !!p);
      if (docPaths.length > 0) {
        await supabase.storage.from('geoadmin-files').remove(docPaths);
      }
    }

    // Delete bounded to snapshotted IDs, in FK-safe order.
    if (invoiceIds.length > 0) {
      await supabase.from('invoice_services').delete().in('invoice_id', invoiceIds);
      await supabase.from('invoice_sends').delete().in('invoice_id', invoiceIds);
      await supabase.from('invoices').delete().in('id', invoiceIds);
    }
    if (caseIds.length > 0) {
      await supabase.from('case_actions').delete().in('case_id', caseIds);
      await supabase.from('case_documents').delete().in('case_id', caseIds);
      await supabase.from('cases').delete().in('id', caseIds);
    }
    // partners/our_companies use ON DELETE RESTRICT from invoices — delete one at a
    // time so a single still-referenced row doesn't abort the rest.
    for (const pid of partnerIds) {
      await supabase.from('partners').delete().eq('id', pid);
    }
    for (const cid of companyIds) {
      await supabase.from('our_companies').delete().eq('id', cid);
    }

    const counts = {
      deleted_cases: caseIds.length,
      deleted_invoices: invoiceIds.length,
      skipped_cases_with_live_invoices: blockedCaseIds.length,
    };

    // Audit the destructive action
    await logActivity({
      userId: user.id,
      action: 'deleted',
      entityType: 'settings',
      entityName: 'trash_emptied',
      details: { ...counts, action: 'empty_trash' },
    });

    return NextResponse.json({
      success: true,
      data: counts,
    });
  } catch (error) {
    console.error('Empty trash error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to empty trash' } },
      { status: 500 }
    );
  }
}
