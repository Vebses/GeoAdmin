import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDefaultEmailContent } from '@/lib/email';
import type { InvoiceWithRelations, OurCompany, Partner, CaseWithRelations } from '@/types';

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

    // Get invoice with all relations (exclude soft-deleted)
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        sender:our_companies(*),
        recipient:partners(*),
        case:cases(*),
        services:invoice_services(*)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'ინვოისი ვერ მოიძებნა' } },
        { status: 404 }
      );
    }

    const typedInvoice = invoice as unknown as InvoiceWithRelations & {
      sender: OurCompany;
      recipient: Partner;
      case: CaseWithRelations;
    };

    // Get default email content
    const defaultContent = getDefaultEmailContent(
      typedInvoice,
      typedInvoice.sender,
      typedInvoice.recipient,
      typedInvoice.case
    );

    // Build attachments list
    const attachments = [
      { 
        name: `Invoice-${typedInvoice.invoice_number}.pdf`, 
        type: 'application/pdf' 
      },
    ];

    // Add document type attachments if enabled
    if (typedInvoice.attach_patient_docs) {
      attachments.push({ name: 'Patient documents', type: 'folder' });
    }
    if (typedInvoice.attach_original_docs) {
      attachments.push({ name: 'Original documents', type: 'folder' });
    }
    if (typedInvoice.attach_medical_docs) {
      attachments.push({ name: 'Medical documents', type: 'folder' });
    }

    return NextResponse.json({
      success: true,
      data: {
        from: {
          email: process.env.RESEND_FROM_EMAIL || 'noreply@geoadmin.ge',
          name: process.env.RESEND_FROM_NAME || typedInvoice.sender.name,
        },
        to: typedInvoice.recipient_email || typedInvoice.recipient.email,
        cc: typedInvoice.cc_emails || [],
        subject: typedInvoice.email_subject || defaultContent.subject,
        body: typedInvoice.email_body || defaultContent.body,
        attachments,
        invoice: {
          id: typedInvoice.id,
          invoice_number: typedInvoice.invoice_number,
          language: typedInvoice.language,
          currency: typedInvoice.currency,
          total: typedInvoice.total,
        },
      },
    });
  } catch (error) {
    console.error('Email preview error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'SERVER_ERROR', 
          message: 'სერვერის შეცდომა' 
        } 
      },
      { status: 500 }
    );
  }
}
