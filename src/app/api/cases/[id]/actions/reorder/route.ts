import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reorderActionsSchema } from '@/lib/utils/validation';
import { canAccessCase } from '@/lib/case-access';
import { zodErrorResponse, describeDbError } from '@/lib/utils/api-errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/cases/[id]/actions/reorder - Reorder actions
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: caseId } = await params;
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    // Enforce case ownership
    const allowed = await canAccessCase(supabase, user.id, caseId);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'ქეისი ვერ მოიძებნა ან არ გაქვთ წვდომა' } },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = reorderActionsSchema.safeParse(body);
    
    if (!validationResult.success) {
      return zodErrorResponse(validationResult.error);
    }

    const { actions } = validationResult.data;

    // Update sort order for each action
    for (const action of actions) {
      await (supabase.from('case_actions') as any)
        .update({ sort_order: action.sort_order, updated_at: new Date().toISOString() })
        .eq('id', action.id)
        .eq('case_id', caseId);
    }

    // Get updated actions
    const { data: updatedActions, error } = await supabase
      .from('case_actions')
      .select(`
        *,
        executor:partners(id, name)
      `)
      .eq('case_id', caseId)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: updatedActions,
    });
  } catch (error) {
    console.error('Case actions reorder error:', error);
    const mapped = describeDbError(error);
    if (mapped) {
      return NextResponse.json({ success: false, error: mapped }, { status: 409 });
    }
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}
