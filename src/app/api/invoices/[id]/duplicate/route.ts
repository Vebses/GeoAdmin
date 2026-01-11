import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Fetch original invoice with services
    const { data: originalInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        services:invoice_services(*)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !originalInvoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'ინვოისი არ მოიძებნა' } },
        { status: 404 }
      );
    }

    // Get sender company for prefix
    const { data: senderCompany } = await supabase
      .from('our_companies')
      .select('invoice_prefix')
      .eq('id', originalInvoice.sender_id)
      .single();

    const prefix = senderCompany?.invoice_prefix || 'INV';

    // Generate new invoice number
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .like('invoice_number', `${prefix}-${year}${month}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;
    if (lastInvoice?.invoice_number) {
      const parts = lastInvoice.invoice_number.split('-');
      nextNumber = parseInt(parts[2]) + 1;
    }
    const invoiceNumber = `${prefix}-${year}${month}-${String(nextNumber).padStart(4, '0')}`;

    // Create new invoice
    const newInvoiceData = {
      invoice_number: invoiceNumber,
      case_id: originalInvoice.case_id,
      recipient_id: originalInvoice.recipient_id,
      sender_id: originalInvoice.sender_id,
      status: 'draft' as const,
      currency: originalInvoice.currency,
      subtotal: originalInvoice.subtotal,
      franchise: originalInvoice.franchise,
      total: originalInvoice.total,
      language: originalInvoice.language,
      email_subject: originalInvoice.email_subject,
      email_body: originalInvoice.email_body,
      recipient_email: originalInvoice.recipient_email,
      cc_emails: originalInvoice.cc_emails,
      attach_patient_docs: originalInvoice.attach_patient_docs,
      attach_original_docs: originalInvoice.attach_original_docs,
      attach_medical_docs: originalInvoice.attach_medical_docs,
      notes: `დუბლირებული ინვოისიდან: ${originalInvoice.invoice_number}`,
      created_by: user.id,
    };

    const { data: newInvoice, error: insertError } = await supabase
      .from('invoices')
      .insert(newInvoiceData)
      .select()
      .single();

    if (insertError) throw insertError;

    // Copy services
    if (originalInvoice.services && originalInvoice.services.length > 0) {
      const servicesData = originalInvoice.services.map((service: Record<string, unknown>, index: number) => ({
        invoice_id: newInvoice.id,
        name: service.name,
        description: service.description,
        quantity: service.quantity,
        unit_price: service.unit_price,
        amount: service.amount,
        sort_order: index,
      }));

      const { error: servicesError } = await supabase
        .from('invoice_services')
        .insert(servicesData);

      if (servicesError) throw servicesError;
    }

    // Fetch complete new invoice
    const { data: completeInvoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        case:cases!invoices_case_id_fkey(id, case_number, patient_name, patient_id),
        sender:our_companies!invoices_sender_id_fkey(id, name, legal_name),
        recipient:partners!invoices_recipient_id_fkey(id, name, legal_name, email),
        creator:users!invoices_created_by_fkey(id, full_name),
        services:invoice_services(*)
      `)
      .eq('id', newInvoice.id)
      .single();

    if (error) throw error;

    // Update case invoices_count
    await supabase.rpc('increment_case_invoices_count', { case_id: originalInvoice.case_id });

    return NextResponse.json({
      success: true,
      data: completeInvoice,
    }, { status: 201 });
  } catch (error) {
    console.error('Invoice duplicate error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}
