import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity-logs';

// Roles that can permanently delete
const ADMIN_ROLES = ['super_admin', 'manager'];
// Required exact confirmation phrase — client must echo this back to prove intent
const CONFIRM_PHRASE = 'PERMANENTLY_DELETE';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const entityToTable: Record<string, string> = {
  case: 'cases',
  invoice: 'invoices',
  partner: 'partners',
  our_company: 'our_companies',
};

// DELETE /api/trash/[id]/permanent - Permanently delete an item
// Requires header `x-delete-confirmation: PERMANENTLY_DELETE` to prevent accidental deletion
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type');

    // Confirmation phrase check — client must send the exact phrase
    const confirmHeader = request.headers.get('x-delete-confirmation') || '';
    if (confirmHeader !== CONFIRM_PHRASE) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFIRMATION_REQUIRED', message: 'დადასტურება საჭიროა (x-delete-confirmation header)' } },
        { status: 400 }
      );
    }

    if (!entityType || !entityToTable[entityType]) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ENTITY', message: 'Invalid entity type' } },
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

    // Check user role (only admin/manager can permanently delete)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData } = await (supabase
      .from('users') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !ADMIN_ROLES.includes(userData.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'მხოლოდ ადმინისტრატორებს შეუძლიათ სამუდამოდ წაშლა' } },
        { status: 403 }
      );
    }

    const table = entityToTable[entityType];

    // Snapshot the row BEFORE deletion so we have an audit record of what was lost
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: snapshot } = await (supabase.from(table) as any)
      .select('*')
      .eq('id', id)
      .single();

    if (!snapshot) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'ჩანაწერი ვერ მოიძებნა' } },
        { status: 404 }
      );
    }

    // For cases, also delete related records
    if (entityType === 'case') {
      await supabase.from('case_actions').delete().eq('case_id', id);
      await supabase.from('case_documents').delete().eq('case_id', id);
    }
    // For invoices, also delete child rows
    if (entityType === 'invoice') {
      await supabase.from('invoice_services').delete().eq('invoice_id', id);
      await supabase.from('invoice_sends').delete().eq('invoice_id', id);
    }

    // Permanently delete the item
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Permanent delete error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DELETE_FAILED', message: 'Failed to delete item' } },
        { status: 500 }
      );
    }

    // Audit — snapshot what was deleted
    const validEntityTypes = ['case', 'invoice', 'partner', 'our_company'] as const;
    if (validEntityTypes.includes(entityType as typeof validEntityTypes[number])) {
      await logActivity({
        userId: user.id,
        action: 'deleted',
        entityType: entityType as typeof validEntityTypes[number],
        entityId: id,
        entityName: (snapshot.case_number || snapshot.invoice_number || snapshot.name || '') as string,
        details: {
          permanent: true,
          snapshot,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Permanent delete error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to delete item' } },
      { status: 500 }
    );
  }
}
