import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ActivityItem {
  id: string;
  type: 'case_created' | 'case_completed' | 'case_updated' | 'invoice_sent' | 'invoice_paid';
  entityType: 'case' | 'invoice';
  entityId: string;
  entityNumber: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  timestamp: string;
  message: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Fetch recent cases (created or completed)
    const { data: recentCases } = await supabase
      .from('cases')
      .select(`
        id,
        case_number,
        status,
        created_at,
        closed_at,
        created_by,
        assigned_to,
        creator:users!cases_created_by_fkey(id, full_name, avatar_url),
        assignee:users!cases_assigned_to_fkey(id, full_name, avatar_url)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit * 2);

    // Fetch recent invoice sends
    const { data: recentInvoices } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        status,
        created_at,
        sent_at,
        paid_at,
        created_by,
        creator:users!invoices_created_by_fkey(id, full_name, avatar_url)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Combine and process activities
    const activities: ActivityItem[] = [];

    // Process cases
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (recentCases || []).forEach((c: any) => {
      // Case created
      activities.push({
        id: `case-created-${c.id}`,
        type: 'case_created',
        entityType: 'case',
        entityId: c.id,
        entityNumber: c.case_number,
        userId: c.created_by,
        userName: c.creator?.full_name || 'Unknown',
        userAvatar: c.creator?.avatar_url,
        timestamp: c.created_at,
        message: `created case #${c.case_number}`,
      });

      // Case completed
      if (c.status === 'completed' && c.closed_at) {
        activities.push({
          id: `case-completed-${c.id}`,
          type: 'case_completed',
          entityType: 'case',
          entityId: c.id,
          entityNumber: c.case_number,
          userId: c.assignee?.id || c.created_by,
          userName: c.assignee?.full_name || c.creator?.full_name || 'Unknown',
          userAvatar: c.assignee?.avatar_url || c.creator?.avatar_url,
          timestamp: c.closed_at,
          message: `completed case #${c.case_number}`,
        });
      }
    });

    // Process invoices
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (recentInvoices || []).forEach((inv: any) => {
      // Invoice sent
      if (inv.sent_at) {
        activities.push({
          id: `invoice-sent-${inv.id}`,
          type: 'invoice_sent',
          entityType: 'invoice',
          entityId: inv.id,
          entityNumber: inv.invoice_number,
          userId: inv.created_by,
          userName: inv.creator?.full_name || 'Unknown',
          userAvatar: inv.creator?.avatar_url,
          timestamp: inv.sent_at,
          message: `sent invoice #${inv.invoice_number}`,
        });
      }

      // Invoice paid
      if (inv.status === 'paid' && inv.paid_at) {
        activities.push({
          id: `invoice-paid-${inv.id}`,
          type: 'invoice_paid',
          entityType: 'invoice',
          entityId: inv.id,
          entityNumber: inv.invoice_number,
          userId: inv.created_by,
          userName: inv.creator?.full_name || 'System',
          userAvatar: inv.creator?.avatar_url,
          timestamp: inv.paid_at,
          message: `Invoice #${inv.invoice_number} was marked as paid`,
        });
      }
    });

    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const limitedActivities = activities.slice(0, limit);

    return NextResponse.json({ success: true, data: limitedActivities });
  } catch (error) {
    console.error('Dashboard activity error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch activity' } },
      { status: 500 }
    );
  }
}
