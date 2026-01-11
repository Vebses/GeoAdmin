import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const markPaidSchema = z.object({
  paid_at: z.string().datetime().optional(),
  paid_amount: z.number().min(0).optional(),
  payment_reference: z.string().max(100).optional().nullable(),
  payment_notes: z.string().max(500).optional().nullable(),
});

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

    // Check if invoice exists
    const { data: existingInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select('id, total, status')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existingInvoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'ინვოისი არ მოიძებნა' } },
        { status: 404 }
      );
    }

    // Check if already paid
    if (existingInvoice.status === 'paid') {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_PAID', message: 'ინვოისი უკვე გადახდილია' } },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const validationResult = markPaidSchema.safeParse(body);
    
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

    const paymentData = validationResult.data;

    // Update invoice
    const updateData = {
      status: 'paid' as const,
      paid_at: paymentData.paid_at || new Date().toISOString(),
      paid_amount: paymentData.paid_amount ?? existingInvoice.total,
      payment_reference: paymentData.payment_reference || null,
      payment_notes: paymentData.payment_notes || null,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id);

    if (updateError) throw updateError;

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
    console.error('Invoice mark-paid error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}
