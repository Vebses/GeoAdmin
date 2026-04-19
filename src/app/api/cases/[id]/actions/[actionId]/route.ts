import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { caseActionSchema } from '@/lib/utils/validation';
import { canAccessCase } from '@/lib/case-access';
import { logCaseActivity } from '@/lib/activity-logs';

interface RouteParams {
  params: Promise<{ id: string; actionId: string }>;
}

// GET /api/cases/[id]/actions/[actionId] - Get single action
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: caseId, actionId } = await params;
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

    const { data, error } = await supabase
      .from('case_actions')
      .select(`
        *,
        executor:partners(id, name)
      `)
      .eq('id', actionId)
      .eq('case_id', caseId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'მოქმედება ვერ მოიძებნა' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Case action GET error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}

// PUT /api/cases/[id]/actions/[actionId] - Update action
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: caseId, actionId } = await params;
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

    // Check if action exists — fetch full row for audit log
    const { data: existingAction, error: findError } = await supabase
      .from('case_actions')
      .select('*')
      .eq('id', actionId)
      .eq('case_id', caseId)
      .single();

    if (findError || !existingAction) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'მოქმედება ვერ მოიძებნა' } },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = caseActionSchema.safeParse({ ...body, case_id: caseId });
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'ვალიდაციის შეცდომა',
            details: validationResult.error.flatten().fieldErrors 
          } 
        },
        { status: 400 }
      );
    }

    const actionData = validationResult.data;

    // Update action
    const updateData = {
      executor_id: actionData.executor_id || null,
      service_name: actionData.service_name,
      service_description: actionData.service_description || null,
      service_cost: actionData.service_cost,
      service_currency: actionData.service_currency,
      assistance_cost: actionData.assistance_cost,
      assistance_currency: actionData.assistance_currency,
      commission_cost: actionData.commission_cost,
      commission_currency: actionData.commission_currency,
      service_date: actionData.service_date?.toISOString().split('T')[0] || null,
      comment: actionData.comment || null,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedAction, error } = await (supabase
      .from('case_actions') as any)
      .update(updateData)
      .eq('id', actionId)
      .select(`
        *,
        executor:partners(id, name)
      `)
      .single();

    if (error) throw error;

    // Update case totals
    await updateCaseTotals(supabase, caseId);

    // Audit — log before/after values for financial fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prevAction = existingAction as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newAction = updatedAction as any;
    await logCaseActivity(
      user.id,
      undefined,
      'updated',
      caseId,
      '',
      {
        action_id: actionId,
        service_name: newAction?.service_name,
        before: {
          service_cost: prevAction.service_cost,
          service_currency: prevAction.service_currency,
          assistance_cost: prevAction.assistance_cost,
          commission_cost: prevAction.commission_cost,
          executor_id: prevAction.executor_id,
        },
        after: {
          service_cost: newAction?.service_cost,
          service_currency: newAction?.service_currency,
          assistance_cost: newAction?.assistance_cost,
          commission_cost: newAction?.commission_cost,
          executor_id: newAction?.executor_id,
        },
      }
    );

    return NextResponse.json({
      success: true,
      data: updatedAction,
    });
  } catch (error) {
    console.error('Case action PUT error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}

// DELETE /api/cases/[id]/actions/[actionId] - Delete action
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: caseId, actionId } = await params;
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

    // Check if action exists — fetch full row for audit log snapshot
    const { data: existingAction, error: findError } = await supabase
      .from('case_actions')
      .select('*')
      .eq('id', actionId)
      .eq('case_id', caseId)
      .single();

    if (findError || !existingAction) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'მოქმედება ვერ მოიძებნა' } },
        { status: 404 }
      );
    }

    // Delete action
    const { error } = await supabase
      .from('case_actions')
      .delete()
      .eq('id', actionId);

    if (error) throw error;

    // Update case totals
    await updateCaseTotals(supabase, caseId);

    // Audit — snapshot the deleted row so it can be reconstructed from logs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deletedSnapshot = existingAction as any;
    await logCaseActivity(
      user.id,
      undefined,
      'deleted',
      caseId,
      '',
      {
        deleted_action_snapshot: deletedSnapshot,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'მოქმედება წაიშალა',
    });
  } catch (error) {
    console.error('Case action DELETE error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}

// Helper function to update case totals
async function updateCaseTotals(supabase: any, caseId: string) {
  const { data: actions } = await supabase
    .from('case_actions')
    .select('service_cost, assistance_cost, commission_cost')
    .eq('case_id', caseId);

  const totals = actions ? actions.reduce(
    (acc: any, action: any) => ({
      total_service_cost: acc.total_service_cost + (action.service_cost || 0),
      total_assistance_cost: acc.total_assistance_cost + (action.assistance_cost || 0),
      total_commission_cost: acc.total_commission_cost + (action.commission_cost || 0),
    }),
    { total_service_cost: 0, total_assistance_cost: 0, total_commission_cost: 0 }
  ) : { total_service_cost: 0, total_assistance_cost: 0, total_commission_cost: 0 };

  await (supabase.from('cases') as any)
    .update({
      ...totals,
      actions_count: actions?.length || 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', caseId);
}
