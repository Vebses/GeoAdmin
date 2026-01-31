import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Role hierarchy for permission checks
const ADMIN_ROLES = ['super_admin', 'manager'];
const PROTECTED_ROLES = ['super_admin', 'manager']; // Roles that only super_admin can manage

function canManageUser(currentUserRole: string, targetUserRole: string): boolean {
  // Super admin can manage anyone
  if (currentUserRole === 'super_admin') return true;
  // Manager can only manage non-admin users
  if (currentUserRole === 'manager') {
    return !PROTECTED_ROLES.includes(targetUserRole);
  }
  return false;
}

function canAssignRole(currentUserRole: string, newRole: string): boolean {
  // Super admin can assign any role
  if (currentUserRole === 'super_admin') return true;
  // Manager can only assign non-admin roles
  if (currentUserRole === 'manager') {
    return !PROTECTED_ROLES.includes(newRole);
  }
  return false;
}

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user, error } = await (supabase
      .from('users') as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('User GET error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch user' } },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { full_name, phone, role } = body;

    const supabase = await createClient();
    
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Get current user's role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentUser } = await (supabase
      .from('users') as any)
      .select('role')
      .eq('id', authUser.id)
      .single();

    const currentUserRole = currentUser?.role || '';

    // Get target user's current role (to check if we can manage them)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: targetUser } = await (supabase
      .from('users') as any)
      .select('role')
      .eq('id', id)
      .single();

    const targetUserRole = targetUser?.role || '';

    // Check if trying to change role
    if (role && role !== targetUserRole) {
      // Must be admin to change roles
      if (!ADMIN_ROLES.includes(currentUserRole)) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'მხოლოდ ადმინისტრატორებს შეუძლიათ როლის ცვლილება' } },
          { status: 403 }
        );
      }
      // Check if allowed to assign this role
      if (!canAssignRole(currentUserRole, role)) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'მხოლოდ სუპერ ადმინს შეუძლია მენეჯერის როლის მინიჭება' } },
          { status: 403 }
        );
      }
      // Check if allowed to manage this user
      if (!canManageUser(currentUserRole, targetUserRole)) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'მხოლოდ სუპერ ადმინს შეუძლია მენეჯერის რედაქტირება' } },
          { status: 403 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, string | undefined> = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined && ADMIN_ROLES.includes(currentUserRole) && canAssignRole(currentUserRole, role)) {
      updateData.role = role;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedUser, error } = await (supabase
      .from('users') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('User update error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'UPDATE_FAILED', message: 'Failed to update user' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('User PUT error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update user' } },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user (soft delete by deactivating)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Check if current user is admin (super_admin or manager)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentUser } = await (supabase
      .from('users') as any)
      .select('role')
      .eq('id', authUser.id)
      .single();

    const currentUserRole = currentUser?.role || '';

    if (!ADMIN_ROLES.includes(currentUserRole)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'მხოლოდ ადმინისტრატორებს შეუძლიათ მომხმარებლების წაშლა' } },
        { status: 403 }
      );
    }

    // Can't delete yourself
    if (id === authUser.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'საკუთარი თავის წაშლა შეუძლებელია' } },
        { status: 403 }
      );
    }

    // Get target user's role to check permissions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: targetUser } = await (supabase
      .from('users') as any)
      .select('role')
      .eq('id', id)
      .single();

    const targetUserRole = targetUser?.role || '';

    // Check if current user can delete this user
    if (!canManageUser(currentUserRole, targetUserRole)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'მხოლოდ სუპერ ადმინს შეუძლია მენეჯერის წაშლა' } },
        { status: 403 }
      );
    }

    // Soft delete by deactivating and anonymizing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase
      .from('users') as any)
      .update({ is_active: false, full_name: '[წაშლილი მომხმარებელი]' })
      .eq('id', id);

    if (error) {
      console.error('User delete error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DELETE_FAILED', message: 'Failed to delete user' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User DELETE error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to delete user' } },
      { status: 500 }
    );
  }
}
