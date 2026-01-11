import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { caseActionSchema } from '@/lib/utils/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/cases/[id]/actions - Get all actions for a case
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Check if case exists
    const { data: caseExists, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .eq('id', caseId)
      .is('deleted_at', null)
      .single();

    if (caseError || !caseExists) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'ქეისი ვერ მოიძებნა' } },
        { status: 404 }
      );
    }

    // Get actions
    const { data, error } = await supabase
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
      data: data || [],
    });
  } catch (error) {
    console.error('Case actions GET error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}

// POST /api/cases/[id]/actions - Create a new action
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

    // Check if case exists
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id, actions_count')
      .eq('id', caseId)
      .is('deleted_at', null)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'ქეისი ვერ მოიძებნა' } },
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

    // Get next sort order
    const { data: lastAction } = await supabase
      .from('case_actions')
      .select('sort_order')
      .eq('case_id', caseId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const nextSortOrder = lastAction ? (lastAction as { sort_order: number }).sort_order + 1 : 0;

    // Create action
    const insertData = {
      case_id: caseId,
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
      sort_order: nextSortOrder,
    };

    const { data: newAction, error } = await supabase
      .from('case_actions')
      .insert(insertData as any)
      .select(`
        *,
        executor:partners(id, name)
      `)
      .single();

    if (error) throw error;

    // Update case actions count and totals
    await updateCaseTotals(supabase, caseId);

    return NextResponse.json({
      success: true,
      data: newAction,
    }, { status: 201 });
  } catch (error) {
    console.error('Case actions POST error:', error);
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

  if (actions) {
    const totals = actions.reduce(
      (acc: any, action: any) => ({
        total_service_cost: acc.total_service_cost + (action.service_cost || 0),
        total_assistance_cost: acc.total_assistance_cost + (action.assistance_cost || 0),
        total_commission_cost: acc.total_commission_cost + (action.commission_cost || 0),
      }),
      { total_service_cost: 0, total_assistance_cost: 0, total_commission_cost: 0 }
    );

    await (supabase.from('cases') as any)
      .update({
        ...totals,
        actions_count: actions.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', caseId);
  }
}
