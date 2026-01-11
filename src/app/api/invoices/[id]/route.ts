import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { invoiceSchema } from '@/lib/utils/validation';

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

    // Fetch invoice with relations
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        case:cases!invoices_case_id_fkey(id, case_number, patient_name, patient_id, status),
        sender:our_companies!invoices_sender_id_fkey(*),
        recipient:partners!invoices_recipient_id_fkey(*),
        creator:users!invoices_created_by_fkey(id, full_name),
        services:invoice_services(*),
        sends:invoice_sends(*)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'ინვოისი არ მოიძებნა' } },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error('Invoice GET error:', error);
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

    // Check if invoice exists
    const { data: existingInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select('id, case_id, status')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existingInvoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'ინვოისი არ მოიძებნა' } },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = invoiceSchema.partial().safeParse(body);
    
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

    const invoiceData = validationResult.data;

    // Calculate totals if services provided
    let subtotal, total;
    if (invoiceData.services && invoiceData.services.length > 0) {
      subtotal = invoiceData.services.reduce((sum, service) => sum + (service.amount || 0), 0);
      total = subtotal - (invoiceData.franchise || 0);
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Add fields if provided
    if (invoiceData.case_id !== undefined) updateData.case_id = invoiceData.case_id;
    if (invoiceData.recipient_id !== undefined) updateData.recipient_id = invoiceData.recipient_id;
    if (invoiceData.sender_id !== undefined) updateData.sender_id = invoiceData.sender_id;
    if (invoiceData.status !== undefined) updateData.status = invoiceData.status;
    if (invoiceData.currency !== undefined) updateData.currency = invoiceData.currency;
    if (invoiceData.franchise !== undefined) updateData.franchise = invoiceData.franchise;
    if (invoiceData.language !== undefined) updateData.language = invoiceData.language;
    if (invoiceData.email_subject !== undefined) updateData.email_subject = invoiceData.email_subject;
    if (invoiceData.email_body !== undefined) updateData.email_body = invoiceData.email_body;
    if (invoiceData.recipient_email !== undefined) updateData.recipient_email = invoiceData.recipient_email;
    if (invoiceData.cc_emails !== undefined) updateData.cc_emails = invoiceData.cc_emails;
    if (invoiceData.attach_patient_docs !== undefined) updateData.attach_patient_docs = invoiceData.attach_patient_docs;
    if (invoiceData.attach_original_docs !== undefined) updateData.attach_original_docs = invoiceData.attach_original_docs;
    if (invoiceData.attach_medical_docs !== undefined) updateData.attach_medical_docs = invoiceData.attach_medical_docs;
    if (invoiceData.notes !== undefined) updateData.notes = invoiceData.notes;
    if (subtotal !== undefined) updateData.subtotal = subtotal;
    if (total !== undefined) updateData.total = Math.max(0, total);

    // Update invoice
    const { error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id);

    if (updateError) throw updateError;

    // Update services if provided
    if (invoiceData.services && invoiceData.services.length > 0) {
      // Delete existing services
      await supabase
        .from('invoice_services')
        .delete()
        .eq('invoice_id', id);

      // Insert new services
      const servicesInsertData = invoiceData.services.map((service, index) => ({
        invoice_id: id,
        name: service.name,
        description: service.description || null,
        quantity: service.quantity || 1,
        unit_price: service.unit_price,
        amount: service.amount,
        sort_order: index,
      }));

      const { error: servicesError } = await supabase
        .from('invoice_services')
        .insert(servicesInsertData);

      if (servicesError) throw servicesError;
    }

    // Fetch updated invoice
    const { data: updatedInvoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        case:cases!invoices_case_id_fkey(id, case_number, patient_name, patient_id),
        sender:our_companies!invoices_sender_id_fkey(id, name, legal_name),
        recipient:partners!invoices_recipient_id_fkey(id, name, legal_name, email),
        creator:users!invoices_created_by_fkey(id, full_name),
        services:invoice_services(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: updatedInvoice,
    });
  } catch (error) {
    console.error('Invoice PUT error:', error);
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

    // Check if invoice exists and get case_id
    const { data: existingInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select('id, case_id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existingInvoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'ინვოისი არ მოიძებნა' } },
        { status: 404 }
      );
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('invoices')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Update case invoices_count
    await supabase.rpc('decrement_case_invoices_count', { case_id: existingInvoice.case_id });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Invoice DELETE error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}
