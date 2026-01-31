import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
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

    // Get invoice
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('id, status, total')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'ინვოისი ვერ მოიძებნა' } },
        { status: 404 }
      );
    }

    const invoiceData = invoice as { id: string; status: string; total: number };

    if (invoiceData.status === 'paid') {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_PAID', message: 'ინვოისი უკვე გადახდილია' } },
        { status: 400 }
      );
    }

    // Parse optional body
    const body = await request.json().catch(() => ({}));
    const { payment_reference, payment_notes } = body as { 
      payment_reference?: string;
      payment_notes?: string;
    };

    // Update invoice
    const updateData = {
      status: 'paid' as const,
      paid_at: new Date().toISOString(),
      payment_reference: payment_reference || null,
      payment_notes: payment_notes || null,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('invoices')
      .update(updateData as never)
      .eq('id', id);

    if (updateError) throw updateError;

    // Fetch updated invoice
    const { data: updatedInvoice, error: refetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        case:cases!invoices_case_id_fkey(id, case_number, patient_name, patient_id),
        sender:our_companies!invoices_sender_id_fkey(id, name, legal_name),
        recipient:partners!invoices_recipient_id_fkey(id, name, legal_name, email),
        creator:users!invoices_created_by_fkey(id, full_name),
        services:invoice_services(*),
        sends:invoice_sends(*)
      `)
      .eq('id', id)
      .single();

    if (refetchError) throw refetchError;

    return NextResponse.json({
      success: true,
      data: updatedInvoice,
      message: 'ინვოისი მონიშნულია როგორც გადახდილი',
    });
  } catch (error) {
    console.error('Invoice mark-paid error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}
