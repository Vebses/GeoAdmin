import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { invoiceSchema } from '@/lib/utils/validation';

interface RouteContext {
  params: Promise<{ id: string }>;
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

    const { data, error } = await supabase
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

    // Check if invoice exists
    const { data: existingInvoice, error: existingError } = await supabase
      .from('invoices')
      .select('id, status, case_id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (existingError || !existingInvoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'ინვოისი ვერ მოიძებნა' } },
        { status: 404 }
      );
    }

    // Parse request body
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

    const updateData = validationResult.data;
    const { services, ...invoiceUpdateData } = updateData;

    // Calculate new totals if services are provided
    let updateObject: Record<string, unknown> = { ...invoiceUpdateData };
    
    if (services && services.length > 0) {
      const subtotal = services.reduce((sum: number, service: { total: number }) => sum + service.total, 0);
      const franchiseAmount = updateData.franchise_amount ?? 0;
      updateObject.subtotal = subtotal;
      updateObject.total = Math.max(0, subtotal - franchiseAmount);
    }

    updateObject.updated_at = new Date().toISOString();

    // Update invoice
    const { error: updateError } = await supabase
      .from('invoices')
      .update(updateObject as never)
      .eq('id', id);

    if (updateError) throw updateError;

    // Update services if provided
    if (services && services.length > 0) {
      // Delete existing services
      await supabase
        .from('invoice_services')
        .delete()
        .eq('invoice_id', id);

      // Insert new services
      const servicesInsertData = services.map((service: { description: string; quantity?: number; unit_price: number; total: number }, index: number) => ({
        invoice_id: id,
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
        sends:invoice_sends(*)
      `)
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

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
