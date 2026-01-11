import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { caseSchema } from '@/lib/utils/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        client:partners!cases_client_id_fkey(id, name),
        insurance:partners!cases_insurance_id_fkey(id, name),
        assigned_user:users!cases_assigned_to_fkey(id, full_name, avatar_url, role),
        creator:users!cases_created_by_fkey(id, full_name),
        actions:case_actions(
          id,
          service_name,
          service_description,
          executor_id,
          service_cost,
          service_currency,
          assistance_cost,
          assistance_currency,
          commission_cost,
          commission_currency,
          sort_order,
          executor:partners(id, name)
        )
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'ქეისი ვერ მოიძებნა' } },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Case GET error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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
    const { data: existingCase, error: findError } = await supabase
      .from('cases')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (findError || !existingCase) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'ქეისი ვერ მოიძებნა' } },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = caseSchema.safeParse(body);
    
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

    const caseData = validationResult.data;

    // Build update object
    const updateData = {
      status: caseData.status,
      priority: caseData.priority,
      patient_name: caseData.patient_name,
      patient_id: caseData.patient_id || null,
      patient_dob: caseData.patient_dob?.toISOString().split('T')[0] || null,
      patient_phone: caseData.patient_phone || null,
      patient_email: caseData.patient_email || null,
      client_id: caseData.client_id || null,
      insurance_id: caseData.insurance_id || null,
      insurance_policy_number: caseData.insurance_policy_number || null,
      assigned_to: caseData.assigned_to || null,
      is_medical: caseData.is_medical,
      is_documented: caseData.is_documented,
      complaints: caseData.complaints || null,
      needs: caseData.needs || null,
      diagnosis: caseData.diagnosis || null,
      treatment_notes: caseData.treatment_notes || null,
      opened_at: caseData.opened_at?.toISOString() || new Date().toISOString(),
      closed_at: caseData.status === 'completed' || caseData.status === 'cancelled' 
        ? new Date().toISOString() 
        : null,
      updated_at: new Date().toISOString(),
    };

    // Update case
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedCase, error } = await (supabase
      .from('cases') as any)
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        client:partners!cases_client_id_fkey(id, name),
        insurance:partners!cases_insurance_id_fkey(id, name),
        assigned_user:users!cases_assigned_to_fkey(id, full_name, avatar_url, role),
        actions:case_actions(
          id,
          service_name,
          service_description,
          executor_id,
          service_cost,
          service_currency,
          assistance_cost,
          assistance_currency,
          commission_cost,
          commission_currency,
          sort_order,
          executor:partners(id, name)
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: updatedCase,
    });
  } catch (error) {
    console.error('Case PUT error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    // Check if user is manager
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if ((profile as any)?.role !== 'manager') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'მხოლოდ მენეჯერს შეუძლია ქეისის წაშლა' } },
        { status: 403 }
      );
    }

    // Check if case exists
    const { data: existingCase, error: findError } = await supabase
      .from('cases')
      .select('id, case_number')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (findError || !existingCase) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'ქეისი ვერ მოიძებნა' } },
        { status: 404 }
      );
    }

    // Soft delete case
    const deleteData = { 
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase
      .from('cases') as any)
      .update(deleteData)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'ქეისი წაიშალა',
    });
  } catch (error) {
    console.error('Case DELETE error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}
