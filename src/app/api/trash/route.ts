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

// GET /api/trash - List all trashed items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type');
    
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const trashedItems: TrashedItem[] = [];
    const now = new Date();

    // Fetch trashed cases
    if (!entityType || entityType === 'case') {
      const { data: cases } = await supabase
        .from('cases')
        .select('id, case_number, patient_name, deleted_at')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (cases) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cases.forEach((c: any) => {
          const deletedDate = new Date(c.deleted_at);
          const daysRemaining = RETENTION_DAYS - Math.floor((now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysRemaining > 0) {
            trashedItems.push({
              id: c.id,
              entity_type: 'case',
              name: `#${c.case_number}`,
              description: c.patient_name,
              deleted_at: c.deleted_at,
              days_remaining: daysRemaining,
            });
          }
        });
      }
    }

    // Fetch trashed invoices
    if (!entityType || entityType === 'invoice') {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, total, deleted_at')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (invoices) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        invoices.forEach((inv: any) => {
          const deletedDate = new Date(inv.deleted_at);
          const daysRemaining = RETENTION_DAYS - Math.floor((now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysRemaining > 0) {
            trashedItems.push({
              id: inv.id,
              entity_type: 'invoice',
              name: `#${inv.invoice_number}`,
              description: `${inv.total?.toFixed(2) || '0.00'}`,
              deleted_at: inv.deleted_at,
              days_remaining: daysRemaining,
            });
          }
        });
      }
    }

    // Fetch trashed partners
    if (!entityType || entityType === 'partner') {
      const { data: partners } = await supabase
        .from('partners')
        .select('id, name, deleted_at')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (partners) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        partners.forEach((p: any) => {
          const deletedDate = new Date(p.deleted_at);
          const daysRemaining = RETENTION_DAYS - Math.floor((now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysRemaining > 0) {
            trashedItems.push({
              id: p.id,
              entity_type: 'partner',
              name: p.name,
              deleted_at: p.deleted_at,
              days_remaining: daysRemaining,
            });
          }
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
