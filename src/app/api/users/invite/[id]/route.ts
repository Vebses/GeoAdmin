import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// DELETE - Cancel invitation (handles both old and new format)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if current user is a manager
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData } = await (supabase
      .from('users') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'manager') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'მხოლოდ მენეჯერს შეუძლია მოწვევის გაუქმება' } },
        { status: 403 }
      );
    }

    // Check URL param to determine which table to delete from
    const url = new URL(request.url);
    const source = url.searchParams.get('source') || 'new';

    if (source === 'old') {
      // OLD FORMAT: Delete from users table (clear invitation fields)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase
        .from('users') as any)
        .delete()
        .eq('id', id)
        .not('invitation_token', 'is', null);

      if (error) {
        console.error('Delete old invitation error:', error);
        return NextResponse.json(
          { success: false, error: { code: 'DELETE_ERROR', message: 'მოწვევის გაუქმება ვერ მოხერხდა' } },
          { status: 500 }
        );
      }
    } else {
      // NEW FORMAT: Delete from user_invitations table
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase
          .from('user_invitations') as any)
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Delete invitation error:', error);
          return NextResponse.json(
            { success: false, error: { code: 'DELETE_ERROR', message: 'მოწვევის გაუქმება ვერ მოხერხდა' } },
            { status: 500 }
          );
        }
      } catch (e) {
        // Table might not exist, try old format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase
          .from('users') as any)
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Delete old invitation fallback error:', error);
          return NextResponse.json(
            { success: false, error: { code: 'DELETE_ERROR', message: 'მოწვევის გაუქმება ვერ მოხერხდა' } },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel invitation error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'შეცდომა' } },
      { status: 500 }
    );
  }
}
