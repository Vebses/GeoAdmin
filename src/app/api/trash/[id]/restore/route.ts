import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const ADMIN_ROLES = ['super_admin', 'manager'];

const entityToTable: Record<string, string> = {
  case: 'cases',
  invoice: 'invoices',
  partner: 'partners',
  our_company: 'our_companies',
};

// POST /api/trash/[id]/restore - Restore a trashed item
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { entity_type } = body;

    if (!entity_type || !entityToTable[entity_type]) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ENTITY', message: 'არასწორი ტიპი' } },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    // Check role - only admins can restore
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData } = await (supabase
      .from('users') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !ADMIN_ROLES.includes(userData.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'მხოლოდ ადმინისტრატორებს შეუძლიათ აღდგენა' } },
        { status: 403 }
      );
    }

    const table = entityToTable[entity_type];

    // Restore by setting deleted_at to null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase
      .from(table) as any)
      .update({ deleted_at: null })
      .eq('id', id);

    if (error) {
      console.error('Restore error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'RESTORE_FAILED', message: 'Failed to restore item' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Restore error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to restore item' } },
      { status: 500 }
    );
  }
}
