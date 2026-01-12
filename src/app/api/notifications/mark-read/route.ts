import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/notifications/mark-read - Mark notifications as read
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notification_ids, mark_all } = body;

    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    if (mark_all) {
      // Mark all notifications as read
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase
        .from('notifications') as any)
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Mark all read error:', error);
        return NextResponse.json(
          { success: false, error: { code: 'UPDATE_FAILED', message: 'Failed to mark as read' } },
          { status: 500 }
        );
      }
    } else if (notification_ids && notification_ids.length > 0) {
      // Mark specific notifications as read
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase
        .from('notifications') as any)
        .update({ is_read: true })
        .eq('user_id', user.id)
        .in('id', notification_ids);

      if (error) {
        console.error('Mark read error:', error);
        return NextResponse.json(
          { success: false, error: { code: 'UPDATE_FAILED', message: 'Failed to mark as read' } },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Provide notification_ids or mark_all' } },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to mark as read' } },
      { status: 500 }
    );
  }
}
