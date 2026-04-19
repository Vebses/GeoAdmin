import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { invoiceSchema } from '@/lib/utils/validation';
import { canAccessInvoice } from '@/lib/case-access';
import { logInvoiceActivity } from '@/lib/activity-logs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Valid status transitions
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['unpaid', 'cancelled'],
  unpaid: ['paid', 'cancelled'],
  paid: [], // No transitions allowed from paid
  cancelled: ['draft'], // Can revert to draft
};

function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  if (currentStatus === newStatus) return true; // No change is always valid
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

export async function GET(request: Request, context: RouteContext) {
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

    // Enforce ownership: user must be admin/accountant or have access to the parent case
    const allowed = await canAccessInvoice(supabase, user.id, id);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'არ გაქვთ ამ ინვოისის წვდომის უფლება' } },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        case:cases!invoices_case_id_fkey(id, case_number, patient_name, patient_id),
        sender:our_companies!invoices_sender_id_fkey(id, name, legal_name),
        recipient:partners!invoices_recipient_id_fkey(id, name, legal_name, email),
        creator:users!invoices_created_by_fkey(id, full_name),
        services:invoice_services(*),
        sends:invoice_sends(id, sent_at, email, status, is_resend)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'ინვოისი ვერ მოიძებნა' } },
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
    console.error('Invoice GET error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
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

    // Enforce ownership
    const allowed = await canAccessInvoice(supabase, user.id, id);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'არ გაქვთ ამ ინვოისის რედაქტირების უფლება' } },
        { status: 403 }
      );
    }

    // Check if invoice exists (with version for optimistic lock)
    const { data: existingInvoice, error: existingError } = await supabase
      .from('invoices')
      .select('id, status, case_id, version')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (existingError || !existingInvoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'ინვოისი ვერ მოიძებნა' } },
        { status: 404 }
      );
    }

    const existingInvoiceData = existingInvoice as { id: string; status: string; case_id: string; version: number };
    const invoiceStatus = existingInvoiceData.status;

    // Prevent editing paid invoices (except notes)
    if (invoiceStatus === 'paid') {
      return NextResponse.json(
        { success: false, error: { code: 'INVOICE_PAID', message: 'გადახდილი ინვოისის რედაქტირება შეუძლებელია' } },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Optimistic locking
    const clientVersion = typeof body.version === 'number' ? body.version : null;
    if (clientVersion !== null && clientVersion !== existingInvoiceData.version) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VERSION_CONFLICT',
            message: 'ინვოისი სხვის მიერ შეიცვალა. გთხოვთ, განაახლოთ გვერდი.',
            current_version: existingInvoiceData.version,
          }
        },
        { status: 409 }
      );
    }

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

    const updateData = validationResult.data;
    const { services, ...invoiceUpdateData } = updateData;

    // Validate status transition if status is being changed
    if (updateData.status && updateData.status !== invoiceStatus) {
      if (!isValidStatusTransition(invoiceStatus, updateData.status)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_STATUS_TRANSITION',
              message: `სტატუსის ცვლილება '${invoiceStatus}' → '${updateData.status}' დაუშვებელია`
            }
          },
          { status: 400 }
        );
      }
    }

    // Calculate new totals if services are provided
    let updateObject: Record<string, unknown> = { ...invoiceUpdateData };
    
    if (services && services.length > 0) {
      // Clamp to non-negative values defensively
      const subtotal = services.reduce((sum: number, service: { total: number }) => sum + Math.max(0, service.total || 0), 0);
      const franchiseAmount = Math.max(0, updateData.franchise_amount ?? 0);
      updateObject.subtotal = subtotal;
      updateObject.total = Math.max(0, subtotal - franchiseAmount);
      updateObject.franchise = franchiseAmount;
    }

    updateObject.updated_at = new Date().toISOString();

    // Update invoice — include version in WHERE for optimistic lock
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateQuery = (supabase.from('invoices') as any)
      .update(updateObject)
      .eq('id', id);
    if (clientVersion !== null) {
      updateQuery.eq('version', clientVersion);
    }
    const { data: updatedRows, error: updateError } = await updateQuery.select('id');

    if (updateError) throw updateError;

    if (!updatedRows || updatedRows.length === 0) {
      // Either the row disappeared or version changed mid-flight
      return NextResponse.json(
        { success: false, error: { code: 'VERSION_CONFLICT', message: 'ინვოისი ახლახან შეიცვალა. სცადეთ ხელახლა.' } },
        { status: 409 }
      );
    }

    // Update services if provided
    if (services && services.length > 0) {
      // Delete existing services
      await supabase
        .from('invoice_services')
        .delete()
        .eq('invoice_id', id);

      // Insert new services (map to correct DB column names)
      const servicesInsertData = services.map((service: { description: string; quantity?: number; unit_price: number; total: number }, index: number) => ({
        invoice_id: id,
        name: service.description,      // DB column is 'name', form field is 'description'
        quantity: service.quantity || 1,
        unit_price: service.unit_price,
        amount: service.total,          // DB column is 'amount', form field is 'total'
        sort_order: index,
      }));

      const { error: servicesError } = await supabase
        .from('invoice_services')
        .insert(servicesInsertData as never);

      if (servicesError) throw servicesError;
    }

    // Fetch updated invoice with relations
    const { data: updatedInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        case:cases!invoices_case_id_fkey(id, case_number, patient_name, patient_id),
        sender:our_companies!invoices_sender_id_fkey(id, name, legal_name),
        recipient:partners!invoices_recipient_id_fkey(id, name, legal_name, email),
        creator:users!invoices_created_by_fkey(id, full_name),
        services:invoice_services(*),
        sends:invoice_sends(id, sent_at, email, status, is_resend)
      `)
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Audit trail — log what changed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedInvoiceData = updatedInvoice as any;
    await logInvoiceActivity(
      user.id,
      undefined,
      updateData.status && updateData.status !== existingInvoiceData.status ? 'updated' : 'updated',
      id,
      updatedInvoiceData?.invoice_number || '',
      {
        old_status: existingInvoiceData.status,
        new_status: updateData.status || existingInvoiceData.status,
        services_changed: Array.isArray(services) && services.length > 0,
        new_total: updateObject.total,
      }
    );

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

export async function DELETE(request: Request, context: RouteContext) {
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

    // Enforce ownership
    const allowed = await canAccessInvoice(supabase, user.id, id);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'არ გაქვთ ამ ინვოისის წაშლის უფლება' } },
        { status: 403 }
      );
    }

    // Get invoice for case_id
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('id, case_id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'ინვოისი ვერ მოიძებნა' } },
        { status: 404 }
      );
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('invoices')
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Decrement case invoices_count
    try {
      await supabase.rpc('decrement_case_invoices_count', { case_id: (invoice as { case_id: string }).case_id } as never);
    } catch (rpcError) {
      console.warn('Failed to decrement case invoices_count:', rpcError);
    }

    return NextResponse.json({
      success: true,
      message: 'ინვოისი წაშლილია',
    });
  } catch (error) {
    console.error('Invoice DELETE error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}
