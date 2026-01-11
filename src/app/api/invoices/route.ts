import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { invoiceSchema } from '@/lib/utils/validation';

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

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const case_id = searchParams.get('case_id');
    const sender_id = searchParams.get('sender_id');
    const recipient_id = searchParams.get('recipient_id');
    const currency = searchParams.get('currency');
    const created_from = searchParams.get('created_from');
    const created_to = searchParams.get('created_to');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('invoices')
      .select(`
        *,
        case:cases!invoices_case_id_fkey(id, case_number, patient_name, patient_id),
        sender:our_companies!invoices_sender_id_fkey(id, name, legal_name),
        recipient:partners!invoices_recipient_id_fkey(id, name, legal_name, email),
        creator:users!invoices_created_by_fkey(id, full_name),
        services:invoice_services(*)
      `, { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (case_id) {
      query = query.eq('case_id', case_id);
    }
    if (sender_id) {
      query = query.eq('sender_id', sender_id);
    }
    if (recipient_id) {
      query = query.eq('recipient_id', recipient_id);
    }
    if (currency) {
      query = query.eq('currency', currency);
    }
    if (created_from) {
      query = query.gte('created_at', created_from);
    }
    if (created_to) {
      query = query.lte('created_at', created_to);
    }
    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%`);
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
    console.error('Invoices GET error:', error);
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

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('Failed to parse request JSON:', e);
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_JSON', message: 'არასწორი JSON ფორმატი' } },
        { status: 400 }
      );
    }

    console.log('Invoice creation request body:', JSON.stringify(body, null, 2));
    
    const validationResult = invoiceSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('Invoice validation error:', validationResult.error.flatten());
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

    const invoiceData = validationResult.data;

    // Get sender company for prefix
    const { data: senderCompanyData } = await supabase
      .from('our_companies')
      .select('invoice_prefix')
      .eq('id', invoiceData.sender_id)
      .single();

    const senderCompany = senderCompanyData as { invoice_prefix: string | null } | null;
    const prefix = senderCompany?.invoice_prefix || 'INV';

    // Generate invoice number
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const { data: lastInvoiceData } = await supabase
      .from('invoices')
      .select('invoice_number')
      .like('invoice_number', `${prefix}-${year}${month}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1)
      .single();

    const lastInvoice = lastInvoiceData as { invoice_number: string } | null;
    let nextNumber = 1;
    if (lastInvoice?.invoice_number) {
      const parts = lastInvoice.invoice_number.split('-');
      nextNumber = parseInt(parts[2]) + 1;
    }
    const invoiceNumber = `${prefix}-${year}${month}-${String(nextNumber).padStart(4, '0')}`;

    // Calculate totals
    const subtotal = invoiceData.services.reduce((sum: number, service: { total: number }) => sum + service.total, 0);
    const franchiseAmount = invoiceData.franchise_amount || 0;
    const total = subtotal - franchiseAmount;

    // Build insert object matching database schema
    const insertData = {
      invoice_number: invoiceNumber,
      case_id: invoiceData.case_id,
      recipient_id: invoiceData.recipient_id,
      sender_id: invoiceData.sender_id,
      status: invoiceData.status || 'draft',
      currency: invoiceData.currency,
      subtotal,
      franchise_amount: franchiseAmount,
      franchise_type: invoiceData.franchise_type || 'fixed',
      franchise_value: invoiceData.franchise_value || 0,
      total: Math.max(0, total),
      language: invoiceData.language,
      email_subject: invoiceData.email_subject || null,
      email_body: invoiceData.email_body || null,
      recipient_email: invoiceData.recipient_email || null,
      cc_emails: invoiceData.cc_emails || [],
      attach_patient_docs: invoiceData.attach_patient_docs || false,
      attach_original_docs: invoiceData.attach_original_docs || false,
      attach_medical_docs: invoiceData.attach_medical_docs || false,
      notes: invoiceData.notes || null,
      created_by: user.id,
    };

    // Create invoice - use type assertion to work around strict types
    const { data: newInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert(insertData as never)
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    const invoiceId = (newInvoice as { id: string }).id;

    // Create services
    if (invoiceData.services.length > 0) {
      const servicesInsertData = invoiceData.services.map((service: { description: string; quantity?: number; unit_price: number; total: number }, index: number) => ({
        invoice_id: invoiceId,
        description: service.description,
        quantity: service.quantity || 1,
        unit_price: service.unit_price,
        total: service.total,
        sort_order: index,
      }));

      const { error: servicesError } = await supabase
        .from('invoice_services')
        .insert(servicesInsertData as never);

      if (servicesError) throw servicesError;
    }

    // Fetch complete invoice with relations
    const { data: completeInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        case:cases!invoices_case_id_fkey(id, case_number, patient_name, patient_id),
        sender:our_companies!invoices_sender_id_fkey(id, name, legal_name),
        recipient:partners!invoices_recipient_id_fkey(id, name, legal_name, email),
        creator:users!invoices_created_by_fkey(id, full_name),
        services:invoice_services(*)
      `)
      .eq('id', invoiceId)
      .single();

    if (fetchError) throw fetchError;

    // Update case invoices_count
    try {
      await supabase.rpc('increment_case_invoices_count', { case_id: invoiceData.case_id } as never);
    } catch (rpcError) {
      console.warn('Failed to increment case invoices_count:', rpcError);
    }

    return NextResponse.json({
      success: true,
      data: completeInvoice,
    }, { status: 201 });
  } catch (error) {
    console.error('Invoices POST error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'SERVER_ERROR', 
          message: 'სერვერის შეცდომა',
          details: errorMessage
        } 
      },
      { status: 500 }
    );
  }
}
