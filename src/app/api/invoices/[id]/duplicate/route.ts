import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface InvoiceData {
  id: string;
  invoice_number: string;
  case_id: string;
  sender_id: string;
  recipient_id: string;
  currency: string;
  subtotal: number;
  franchise_amount: number;
  franchise_type: string;
  franchise_value: number;
  total: number;
  language: string;
  email_subject: string | null;
  email_body: string | null;
  recipient_email: string | null;
  cc_emails: string[] | null;
  attach_patient_docs: boolean;
  attach_original_docs: boolean;
  attach_medical_docs: boolean;
  services: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    sort_order: number;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    // Get original invoice with services
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
        { success: false, error: { code: 'NOT_FOUND', message: 'ინვოისი ვერ მოიძებნა' } },
        { status: 404 }
      );
    }

    const invoice = originalInvoice as unknown as InvoiceData;

    // Get sender company for prefix
    const { data: senderCompanyData } = await supabase
      .from('our_companies')
      .select('invoice_prefix')
      .eq('id', invoice.sender_id)
      .single();

    const senderCompany = senderCompanyData as { invoice_prefix: string | null } | null;
    const prefix = senderCompany?.invoice_prefix || 'INV';

    // Generate new invoice number
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
    const newInvoiceNumber = `${prefix}-${year}${month}-${String(nextNumber).padStart(4, '0')}`;

    // Create duplicate invoice
    const duplicateData = {
      invoice_number: newInvoiceNumber,
      case_id: invoice.case_id,
      recipient_id: invoice.recipient_id,
      sender_id: invoice.sender_id,
      status: 'draft' as const,
      currency: invoice.currency,
      subtotal: invoice.subtotal,
      franchise_amount: invoice.franchise_amount,
      franchise_type: invoice.franchise_type,
      franchise_value: invoice.franchise_value,
      total: invoice.total,
      language: invoice.language,
      email_subject: invoice.email_subject,
      email_body: invoice.email_body,
      recipient_email: invoice.recipient_email,
      cc_emails: invoice.cc_emails,
      attach_patient_docs: invoice.attach_patient_docs,
      attach_original_docs: invoice.attach_original_docs,
      attach_medical_docs: invoice.attach_medical_docs,
      notes: `დუბლირებული ინვოისიდან: ${invoice.invoice_number}`,
      created_by: user.id,
    };

    const { data: newInvoice, error: insertError } = await supabase
      .from('invoices')
      .insert(duplicateData as never)
      .select()
      .single();

    if (insertError) throw insertError;

    const newInvoiceId = (newInvoice as { id: string }).id;

    // Duplicate services
    if (invoice.services && invoice.services.length > 0) {
      const servicesData = invoice.services.map((service, index) => ({
        invoice_id: newInvoiceId,
        description: service.description,
        quantity: service.quantity,
        unit_price: service.unit_price,
        total: service.total,
        sort_order: index,
      }));

      const { error: servicesError } = await supabase
        .from('invoice_services')
        .insert(servicesData as never);

      if (servicesError) throw servicesError;
    }

    // Fetch complete new invoice
    const { data: completeInvoice, error: refetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        case:cases!invoices_case_id_fkey(id, case_number, patient_name, patient_id),
        sender:our_companies!invoices_sender_id_fkey(id, name, legal_name),
        recipient:partners!invoices_recipient_id_fkey(id, name, legal_name, email),
        creator:users!invoices_created_by_fkey(id, full_name),
        services:invoice_services(*)
      `)
      .eq('id', newInvoiceId)
      .single();

    if (refetchError) throw refetchError;

    // Update case invoices_count
    try {
      await supabase.rpc('increment_case_invoices_count', { case_id: invoice.case_id } as never);
    } catch (rpcError) {
      console.warn('Failed to increment case invoices_count:', rpcError);
    }

    return NextResponse.json({
      success: true,
      data: completeInvoice,
      message: 'ინვოისი დუბლირებულია',
    }, { status: 201 });
  } catch (error) {
    console.error('Invoice duplicate error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}
