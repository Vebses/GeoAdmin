import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface TrashedItem {
  id: string;
  entity_type: 'case' | 'invoice' | 'partner' | 'our_company';
  name: string;
  description?: string;
  deleted_at: string;
  deleted_by?: string;
  days_remaining: number;
}

const RETENTION_DAYS = 30;
const ADMIN_ROLES = ['super_admin', 'manager'];
const MAX_TRASH_ITEMS_PER_TABLE = 500;

// GET /api/trash - List all trashed items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type');

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    // Check role - only admins can view trash
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData } = await (supabase
      .from('users') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !ADMIN_ROLES.includes(userData.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'მხოლოდ ადმინისტრატორებს აქვთ წვდომა' } },
        { status: 403 }
      );
    }

    const trashedItems: TrashedItem[] = [];
    const now = new Date();
    // Filter at DB level: only items within retention period
    const retentionCutoff = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // Helper to calculate days remaining
    const calcDaysRemaining = (deletedAt: string) => {
      const deletedDate = new Date(deletedAt);
      return RETENTION_DAYS - Math.floor((now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
    };

    // Fetch trashed cases (with DB-level retention filter and LIMIT)
    if (!entityType || entityType === 'case') {
      const { data: cases } = await supabase
        .from('cases')
        .select('id, case_number, patient_name, deleted_at')
        .not('deleted_at', 'is', null)
        .gt('deleted_at', retentionCutoff)
        .order('deleted_at', { ascending: false })
        .limit(MAX_TRASH_ITEMS_PER_TABLE);

      if (cases) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cases.forEach((c: any) => {
          trashedItems.push({
            id: c.id,
            entity_type: 'case',
            name: `#${c.case_number}`,
            description: c.patient_name,
            deleted_at: c.deleted_at,
            days_remaining: calcDaysRemaining(c.deleted_at),
          });
        });
      }
    }

    // Fetch trashed invoices
    if (!entityType || entityType === 'invoice') {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, total, deleted_at')
        .not('deleted_at', 'is', null)
        .gt('deleted_at', retentionCutoff)
        .order('deleted_at', { ascending: false })
        .limit(MAX_TRASH_ITEMS_PER_TABLE);

      if (invoices) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        invoices.forEach((inv: any) => {
          trashedItems.push({
            id: inv.id,
            entity_type: 'invoice',
            name: `#${inv.invoice_number}`,
            description: `${inv.total?.toFixed(2) || '0.00'}`,
            deleted_at: inv.deleted_at,
            days_remaining: calcDaysRemaining(inv.deleted_at),
          });
        });
      }
    }

    // Fetch trashed partners
    if (!entityType || entityType === 'partner') {
      const { data: partners } = await supabase
        .from('partners')
        .select('id, name, deleted_at')
        .not('deleted_at', 'is', null)
        .gt('deleted_at', retentionCutoff)
        .order('deleted_at', { ascending: false })
        .limit(MAX_TRASH_ITEMS_PER_TABLE);

      if (partners) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        partners.forEach((p: any) => {
          trashedItems.push({
            id: p.id,
            entity_type: 'partner',
            name: p.name,
            deleted_at: p.deleted_at,
            days_remaining: calcDaysRemaining(p.deleted_at),
          });
        });
      }
    }

    // Sort by deleted_at desc
    trashedItems.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());

    return NextResponse.json({ success: true, data: trashedItems });
  } catch (error) {
    console.error('Trash list error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch trash' } },
      { status: 500 }
    );
  }
}
