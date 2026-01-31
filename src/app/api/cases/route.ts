import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { caseSchema } from '@/lib/utils/validation';
import { notifyCaseAssigned } from '@/lib/notifications';
import { logCaseActivity } from '@/lib/activity-logs';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    // Get current user's profile for role-based filtering
    const { data: currentUserProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const assigned_to = searchParams.get('assigned_to');
    const client_id = searchParams.get('client_id');
    const insurance_id = searchParams.get('insurance_id');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    const my_cases = searchParams.get('my_cases') === 'true';

    // Build query
    let query = supabase
      .from('cases')
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
      `, { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    // For my_cases filter or if assistant filtering their own
    if (my_cases || (assigned_to && assigned_to === user.id)) {
      query = query.eq('assigned_to', user.id);
    } else if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }
    
    if (client_id) {
      query = query.eq('client_id', client_id);
    }
    if (insurance_id) {
      query = query.eq('insurance_id', insurance_id);
    }
    if (search) {
      // Sanitize search input to prevent injection
      const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&');
      query = query.or(`case_number.ilike.%${sanitizedSearch}%,patient_name.ilike.%${sanitizedSearch}%,patient_id.ilike.%${sanitizedSearch}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Cases GET error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    // Get current user's profile
    const { data: currentUserProfile } = await supabase
      .from('users')
      .select('id, role, full_name')
      .eq('id', user.id)
      .single();

    const userRole = (currentUserProfile as any)?.role || 'assistant';

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

    // IMPORTANT: For assistants, always assign case to themselves
    // For managers, use selected assigned_to or default to themselves
    let assignedTo = caseData.assigned_to;
    
    if (userRole === 'assistant') {
      // Assistants can only create cases assigned to themselves
      assignedTo = user.id;
    } else if (!assignedTo) {
      // Managers default to themselves if no assistant selected
      assignedTo = user.id;
    }

    // Generate case number atomically using database function
    const { data: caseNumberData, error: caseNumberError } = await supabase
      .rpc('generate_case_number');

    if (caseNumberError) {
      console.error('Failed to generate case number:', caseNumberError);
      throw new Error('Failed to generate case number');
    }

    const caseNumber = caseNumberData as string;

    // Build insert object
    const insertData = {
      case_number: caseNumber,
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
      assigned_to: assignedTo,
      is_medical: caseData.is_medical,
      is_documented: caseData.is_documented,
      complaints: caseData.complaints || null,
      needs: caseData.needs || null,
      diagnosis: caseData.diagnosis || null,
      treatment_notes: caseData.treatment_notes || null,
      opened_at: caseData.opened_at?.toISOString() || new Date().toISOString(),
      created_by: user.id,
    };

    // Create case
    const { data: newCase, error } = await supabase
      .from('cases')
      .insert(insertData as any)
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

    // Log activity
    await logCaseActivity(
      user.id,
      (currentUserProfile as any)?.full_name,
      'created',
      (newCase as any).id,
      caseNumber,
      {
        patient_name: caseData.patient_name,
        assigned_to: assignedTo,
      }
    );

    // Send notification if assigned to someone else (manager assigning to assistant)
    if (assignedTo && assignedTo !== user.id) {
      await notifyCaseAssigned(
        assignedTo,
        (newCase as any).id,
        caseNumber,
        user.id
      );
    }

    return NextResponse.json({
      success: true,
      data: newCase,
    }, { status: 201 });
  } catch (error) {
    console.error('Cases POST error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}
