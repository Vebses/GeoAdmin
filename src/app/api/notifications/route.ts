import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface Notification {
  id: string;
  user_id: string;
  type: 'case_assigned' | 'invoice_paid' | 'case_completed' | 'system';
  title: string;
  message: string | null;
  link: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

// GET /api/notifications - List user notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread') === 'true';
    
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase
      .from('notifications') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Notifications fetch error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch notifications' } },
        { status: 500 }
      );
    }

    // Get unread count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: unreadCount } = await (supabase
      .from('notifications') as any)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    return NextResponse.json({ 
      success: true, 
      data: {
        notifications: notifications || [],
        unreadCount: unreadCount || 0,
      }
    });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch notifications' } },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a notification (internal use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, type, title, message, link, entity_type, entity_id } = body;

    if (!user_id || !type || !title) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: notification, error } = await (supabase
      .from('notifications') as any)
      .insert({
        user_id,
        type,
        title,
        message,
        link,
        entity_type,
        entity_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Notification create error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'CREATE_FAILED', message: 'Failed to create notification' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: notification });
  } catch (error) {
    console.error('Notifications POST error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create notification' } },
      { status: 500 }
    );
  }
}
