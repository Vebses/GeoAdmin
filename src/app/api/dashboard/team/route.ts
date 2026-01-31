import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ADMIN_ROLES = ['super_admin', 'manager', 'admin'];

interface TeamMember {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
  assigned: number;
  completed: number;
  avgDays: number | null;
  rate: number;
}

interface TeamResponse {
  members: TeamMember[];
}

interface UserRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
}

interface UserRoleRow {
  role: string;
}

interface CaseCompletionRow {
  opened_at: string;
  closed_at: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRoleData = userData as UserRoleRow | null;
    if (!userRoleData || !ADMIN_ROLES.includes(userRoleData.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Calculate period start
    const now = new Date();
    const periodStart = getPeriodStart(now, period);

    // Get all active users (assistants and managers who can be assigned cases)
    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, role')
      .eq('is_active', true)
      .in('role', ['assistant', 'manager', 'admin', 'super_admin']);

    const users = (usersData || []) as UserRow[];

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        data: { members: [] } as TeamResponse,
      });
    }

    // Get case stats for each user
    const members: TeamMember[] = await Promise.all(
      users.map(async (u) => {
        // Assigned cases (current active)
        const { count: assigned } = await supabase
          .from('cases')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null)
          .eq('assigned_to', u.id)
          .in('status', ['draft', 'in_progress', 'paused', 'delayed']);

        // Completed cases in period
        const { count: completed } = await supabase
          .from('cases')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null)
          .eq('assigned_to', u.id)
          .eq('status', 'completed')
          .gte('closed_at', periodStart.toISOString());

        // Average completion time (days from opened to closed)
        const { data: completedCasesData } = await supabase
          .from('cases')
          .select('opened_at, closed_at')
          .is('deleted_at', null)
          .eq('assigned_to', u.id)
          .eq('status', 'completed')
          .not('closed_at', 'is', null)
          .gte('closed_at', periodStart.toISOString());

        const completedCases = (completedCasesData || []) as CaseCompletionRow[];

        let avgDays: number | null = null;
        if (completedCases.length > 0) {
          const totalDays = completedCases.reduce((sum, c) => {
            const opened = new Date(c.opened_at);
            const closed = new Date(c.closed_at!);
            const days = (closed.getTime() - opened.getTime()) / (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0);
          avgDays = Math.round((totalDays / completedCases.length) * 10) / 10;
        }

        // Completion rate (completed / (assigned + completed) * 100)
        const totalHandled = (assigned || 0) + (completed || 0);
        const rate = totalHandled > 0 ? Math.round(((completed || 0) / totalHandled) * 100) : 0;

        return {
          id: u.id,
          name: u.full_name || 'უცნობი',
          avatar: u.avatar_url,
          role: u.role,
          assigned: assigned || 0,
          completed: completed || 0,
          avgDays,
          rate,
        };
      })
    );

    // Sort by completion rate descending
    members.sort((a, b) => b.rate - a.rate);

    return NextResponse.json({
      success: true,
      data: { members } as TeamResponse,
    });
  } catch (error) {
    console.error('Dashboard team error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch team stats' } },
      { status: 500 }
    );
  }
}

function getPeriodStart(date: Date, period: string): Date {
  const d = new Date(date);
  switch (period) {
    case 'week':
      d.setDate(d.getDate() - d.getDay());
      break;
    case 'month':
      d.setDate(1);
      break;
    case 'quarter':
      d.setMonth(Math.floor(d.getMonth() / 3) * 3, 1);
      break;
    case 'year':
      d.setMonth(0, 1);
      break;
  }
  d.setHours(0, 0, 0, 0);
  return d;
}
