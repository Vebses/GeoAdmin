import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDefaultEmailContent, buildEmailSignOff, stripTrailingSignOff } from '@/lib/email';
import { canAccessInvoice } from '@/lib/case-access';
import type { InvoiceWithRelations, OurCompany, Partner, CaseWithRelations, InvoiceLanguage } from '@/types';

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

    // Enforce invoice ownership
    const allowed = await canAccessInvoice(supabase, user.id, id);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'არ გაქვთ ამ ინვოისის წვდომა' } },
        { status: 403 }
      );
    }

    // Get invoice with all relations (exclude soft-deleted)
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        sender:our_companies(*),
        recipient:partners(*),
        case:cases(*, assigned_user:users!cases_assigned_to_fkey(id, full_name, email, phone, job_title, email_signature)),
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

    // Get default email content (the message body, sign-off excluded)
    const defaultContent = getDefaultEmailContent(
      typedInvoice,
      typedInvoice.sender,
      typedInvoice.recipient,
      typedInvoice.case
    );

    // The case-manager sign-off is appended to the bottom of the email at send
    // time; surface it so the preview mirrors exactly what will be sent.
    const signOff = buildEmailSignOff(
      typedInvoice.sender,
      typedInvoice.case,
      (typedInvoice.language || 'en') as InvoiceLanguage
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

    // Preview must mirror send.ts logic: sender (selected company) takes priority over env.
    const fromEmail = typedInvoice.sender.email || process.env.RESEND_FROM_EMAIL || 'invoices@geoadmin.ge';
    const fromName = typedInvoice.sender.name || process.env.RESEND_FROM_NAME || 'GeoAdmin';

    return NextResponse.json({
      success: true,
      data: {
        from: {
          email: fromEmail,
          name: fromName,
        },
        to: typedInvoice.recipient_email || typedInvoice.recipient.email,
        cc: typedInvoice.cc_emails || [],
        subject: typedInvoice.email_subject || defaultContent.subject,
        body: stripTrailingSignOff(typedInvoice.email_body || defaultContent.body),
        signature: signOff,
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
