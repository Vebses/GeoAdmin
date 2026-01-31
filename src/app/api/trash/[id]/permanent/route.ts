import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Roles that can permanently delete
const ADMIN_ROLES = ['super_admin', 'manager'];

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
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type');

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

    // For cases, also delete related records
    if (entityType === 'case') {
      // Delete case actions
      await supabase
        .from('case_actions')
        .delete()
        .eq('case_id', id);

      // Delete case documents
      await supabase
        .from('case_documents')
        .delete()
        .eq('case_id', id);
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Permanent delete error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to delete item' } },
      { status: 500 }
    );
  }
}
