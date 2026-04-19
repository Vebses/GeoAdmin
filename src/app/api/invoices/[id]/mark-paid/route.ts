import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isAuthError, FINANCE_ROLES } from '@/lib/auth-utils';
import { logInvoiceActivity } from '@/lib/activity-logs';
import { canAccessInvoice } from '@/lib/case-access';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Only admins and accountants can mark invoices as paid
    const auth = await requireAuth(FINANCE_ROLES);
    if (isAuthError(auth)) return auth.response;

    const supabase = await createClient();

    // Case-ownership belt & braces
    const allowed = await canAccessInvoice(supabase, auth.user.id, id);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'არ გაქვთ წვდომა' } },
        { status: 403 }
      );
    }

    // Get invoice
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('id, invoice_number, status, total, currency')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'ინვოისი ვერ მოიძებნა' } },
        { status: 404 }
      );
    }

    const invoiceData = invoice as { id: string; invoice_number: string; status: string; total: number; currency: string };

    if (invoiceData.status === 'paid') {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_PAID', message: 'ინვოისი უკვე გადახდილია' } },
        { status: 400 }
      );
    }

    // Parse optional body
    const body = await request.json().catch(() => ({}));
    const { payment_reference, payment_notes, paid_amount } = body as {
      payment_reference?: string;
      payment_notes?: string;
      paid_amount?: number;
    };

    // Validate paid_amount (if provided) — must be non-negative and <= invoice total + 1% tolerance
    let validatedPaidAmount: number | null = null;
    if (paid_amount !== undefined && paid_amount !== null) {
      if (typeof paid_amount !== 'number' || !Number.isFinite(paid_amount) || paid_amount < 0) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_AMOUNT', message: 'გადახდის თანხა უნდა იყოს არაუარყოფითი რიცხვი' } },
          { status: 400 }
        );
      }
      // Allow 1% overpayment tolerance (rounding, fees). Reject more than that.
      const maxAllowed = (invoiceData.total || 0) * 1.01;
      if (paid_amount > maxAllowed) {
        return NextResponse.json(
          { success: false, error: { code: 'AMOUNT_TOO_HIGH', message: 'გადახდის თანხა აღემატება ინვოისის ჯამს' } },
          { status: 400 }
        );
      }
      validatedPaidAmount = paid_amount;
    }

    // Sanitize optional text fields
    const safeRef = typeof payment_reference === 'string' ? payment_reference.trim().substring(0, 200) : null;
    const safeNotes = typeof payment_notes === 'string' ? payment_notes.substring(0, 2000) : null;

    // Update invoice
    const updateData = {
      status: 'paid' as const,
      paid_at: new Date().toISOString(),
      paid_amount: validatedPaidAmount ?? invoiceData.total,
      payment_reference: safeRef || null,
      payment_notes: safeNotes || null,
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

    // Audit trail — critical financial action must be logged
    await logInvoiceActivity(
      auth.user.id,
      undefined,
      'paid',
      id,
      invoiceData.invoice_number,
      {
        old_status: invoiceData.status,
        new_status: 'paid',
        total: invoiceData.total,
        currency: invoiceData.currency,
        payment_reference: payment_reference || null,
        payment_notes: payment_notes || null,
        paid_at: updateData.paid_at,
      }
    );

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
