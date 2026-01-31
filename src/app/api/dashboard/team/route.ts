import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canViewTeam } from '@/lib/constants/roles';

interface CasesByStatus {
  draft: number;
  in_progress: number;
  paused: number;
  delayed: number;
  completed: number;
}

interface TeamMember {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
  totalCases: number;
  casesByStatus: CasesByStatus;
  completedInPeriod: number;
  avgDays: number | null;
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
    if (!userRoleData || !canViewTeam(userRoleData.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Calculate period start
    const now = new Date();
    const periodStart = getPeriodStart(now, period);

    // Get all users who can work on cases (all roles except accountant)
    // Show all users even with 0 cases assigned
    // Valid DB roles: manager, assistant, accountant, super_admin (NO 'admin' role exists!)
    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, role')
      .in('role', ['assistant', 'manager', 'super_admin'])
      .order('full_name');

    const users = (usersData || []) as UserRow[];

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        data: { members: [] } as TeamResponse,
      });
    }

    // Get case stats for each user with status breakdown
    const members: TeamMember[] = await Promise.all(
      users.map(async (u) => {
        // Get cases by status
        const statuses = ['draft', 'in_progress', 'paused', 'delayed', 'completed'] as const;
        const casesByStatus: CasesByStatus = {
          draft: 0,
          in_progress: 0,
          paused: 0,
          delayed: 0,
          completed: 0,
        };

        // Fetch counts for each status in parallel
        const statusCounts = await Promise.all(
          statuses.map(async (status) => {
            const { count } = await supabase
              .from('cases')
              .select('*', { count: 'exact', head: true })
              .is('deleted_at', null)
              .eq('assigned_to', u.id)
              .eq('status', status);
            return { status, count: count || 0 };
          })
        );

        statusCounts.forEach(({ status, count }) => {
          casesByStatus[status] = count;
        });

        const totalCases = Object.values(casesByStatus).reduce((a, b) => a + b, 0);

        // Completed cases in selected period
        const { count: completedInPeriod } = await supabase
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

        return {
          id: u.id,
          name: u.full_name || 'უცნობი',
          avatar: u.avatar_url,
          role: u.role,
          totalCases,
          casesByStatus,
          completedInPeriod: completedInPeriod || 0,
          avgDays,
        };
      })
    );

    // Sort by total cases descending
    members.sort((a, b) => b.totalCases - a.totalCases);

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
