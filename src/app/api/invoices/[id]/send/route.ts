import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInvoicePDF } from '@/lib/pdf';
import { sendInvoiceEmail, isValidEmail } from '@/lib/email';
import type { InvoiceWithRelations, OurCompany, Partner, CaseWithRelations, InvoiceLanguage } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface SendRequest {
  email?: string;
  cc_emails?: string[];
  subject?: string;
  body?: string;
  regenerate_pdf?: boolean;
  // Attachment flags - if provided, override invoice settings
  attach_patient_docs?: boolean;
  attach_original_docs?: boolean;
  attach_medical_docs?: boolean;
}

// Validate and filter CC emails
function validateCCEmails(emails: string[] | undefined | null): string[] {
  if (!emails || !Array.isArray(emails)) return [];
  return emails.filter(email => typeof email === 'string' && isValidEmail(email.trim()));
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: SendRequest = await request.json();
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
        services:invoice_services(*),
        sends:invoice_sends(*)
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
      sends: Array<{ id: string }>;
    };

    // Validate invoice status - cannot send paid or cancelled invoices
    if (typedInvoice.status === 'paid') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: 'გადახდილი ინვოისის გაგზავნა შეუძლებელია' } },
        { status: 400 }
      );
    }
    if (typedInvoice.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: 'გაუქმებული ინვოისის გაგზავნა შეუძლებელია' } },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF({
      invoice: typedInvoice,
      sender: typedInvoice.sender,
      recipient: typedInvoice.recipient,
      caseData: typedInvoice.case,
      language: (typedInvoice.language || 'en') as InvoiceLanguage,
    });

    // Determine recipient email
    const recipientEmail = body.email || typedInvoice.recipient_email || typedInvoice.recipient.email;
    if (!recipientEmail) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_EMAIL', message: 'ადრესატის ელ-ფოსტა არ არის მითითებული' } },
        { status: 400 }
      );
    }

    // Fetch additional attachments if needed
    const additionalAttachments: Array<{ filename: string; content: Buffer }> = [];

    // Use request body flags if provided, otherwise fall back to invoice settings
    const shouldAttachPatientDocs = body.attach_patient_docs ?? typedInvoice.attach_patient_docs ?? false;
    const shouldAttachOriginalDocs = body.attach_original_docs ?? typedInvoice.attach_original_docs ?? false;
    const shouldAttachMedicalDocs = body.attach_medical_docs ?? typedInvoice.attach_medical_docs ?? false;

    // Track failed attachments for response metadata
    const failedAttachments: string[] = [];

    // Helper function to fetch document attachments
    const fetchDocumentAttachments = async (caseId: string, docType: string) => {
      const { data: docs, error } = await supabase
        .from('case_documents')
        .select('*')
        .eq('case_id', caseId)
        .eq('type', docType);

      if (error) {
        console.error(`Error fetching ${docType} documents:`, error);
        failedAttachments.push(`${docType}: database error`);
        return;
      }

      if (docs) {
        for (const doc of docs as Array<{ file_url: string; file_name: string }>) {
          if (doc.file_url) {
            try {
              const response = await fetch(doc.file_url);
              if (response.ok) {
                const buffer = await response.arrayBuffer();
                additionalAttachments.push({
                  filename: doc.file_name,
                  content: Buffer.from(buffer),
                });
              } else {
                console.warn(`Failed to fetch document (${response.status}): ${doc.file_name}`);
                failedAttachments.push(doc.file_name);
              }
            } catch (err) {
              console.warn(`Failed to fetch document: ${doc.file_name}`, err);
              failedAttachments.push(doc.file_name);
            }
          }
        }
      }
    };

    // Fetch attachments based on resolved settings
    if (shouldAttachPatientDocs) {
      await fetchDocumentAttachments(typedInvoice.case_id, 'patient');
    }
    if (shouldAttachOriginalDocs) {
      await fetchDocumentAttachments(typedInvoice.case_id, 'original');
    }
    if (shouldAttachMedicalDocs) {
      await fetchDocumentAttachments(typedInvoice.case_id, 'medical');
    }

    // Validate and filter CC emails
    const validatedCCEmails = validateCCEmails(body.cc_emails) || validateCCEmails(typedInvoice.cc_emails);

    // Send email
    const sendResult = await sendInvoiceEmail({
      invoice: typedInvoice,
      sender: typedInvoice.sender,
      recipient: typedInvoice.recipient,
      caseData: typedInvoice.case,
      pdfBuffer,
      to: recipientEmail,
      cc: validatedCCEmails,
      subject: body.subject,
      body: body.body,
      additionalAttachments,
    });

    if (!sendResult.success) {
      // Log failed send
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('invoice_sends') as any).insert({
        invoice_id: id,
        sent_by: user.id,
        email: recipientEmail,
        cc_emails: validatedCCEmails,
        subject: body.subject || typedInvoice.email_subject || '',
        body: body.body || typedInvoice.email_body || '',
        status: 'failed',
        error_message: sendResult.error,
        is_resend: (typedInvoice.sends?.length || 0) > 0,
      });

      return NextResponse.json(
        { success: false, error: { code: 'SEND_FAILED', message: sendResult.error || 'გაგზავნა ვერ მოხერხდა' } },
        { status: 500 }
      );
    }

    // Log successful send
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sendLog } = await (supabase
      .from('invoice_sends') as any)
      .insert({
        invoice_id: id,
        sent_by: user.id,
        email: recipientEmail,
        cc_emails: validatedCCEmails,
        subject: body.subject || typedInvoice.email_subject || '',
        body: body.body || typedInvoice.email_body || '',
        status: 'sent',
        resend_id: sendResult.messageId,
        is_resend: (typedInvoice.sends?.length || 0) > 0,
      })
      .select()
      .single();

    // Update invoice status if it was draft
    if (typedInvoice.status === 'draft') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase
        .from('invoices') as any)
        .update({ 
          status: 'unpaid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    }

    return NextResponse.json({
      success: true,
      data: {
        send_id: sendLog?.id,
        message_id: sendResult.messageId,
        email: recipientEmail,
        sent_at: new Date().toISOString(),
        attachments_count: additionalAttachments.length + 1, // +1 for PDF
        failed_attachments: failedAttachments.length > 0 ? failedAttachments : undefined,
      },
    });
  } catch (error) {
    console.error('Send invoice error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'SERVER_ERROR', 
          message: 'სერვერის შეცდომა',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}
