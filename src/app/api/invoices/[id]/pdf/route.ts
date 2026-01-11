import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInvoicePDF, generatePDFFilename, getContentDisposition } from '@/lib/pdf';
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

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const download = searchParams.get('download') === 'true';
    const regenerate = searchParams.get('regenerate') === 'true';

    // Get invoice with all relations
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

    // Check if we have a cached PDF and don't need to regenerate
    if (typedInvoice.pdf_url && !regenerate) {
      // Return cached PDF URL (redirect)
      return NextResponse.redirect(typedInvoice.pdf_url);
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF({
      invoice: typedInvoice,
      sender: typedInvoice.sender,
      recipient: typedInvoice.recipient,
      caseData: typedInvoice.case,
      language: (typedInvoice.language || 'en') as InvoiceLanguage,
    });

    // Generate filename
    const filename = generatePDFFilename(
      typedInvoice.invoice_number,
      (typedInvoice.language || 'en') as InvoiceLanguage
    );

    // Update invoice with generation timestamp
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase
      .from('invoices') as any)
      .update({ 
        pdf_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Return PDF
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', getContentDisposition(filename, !download));
    headers.set('Content-Length', pdfBuffer.length.toString());

    return new NextResponse(new Uint8Array(pdfBuffer), { headers });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'SERVER_ERROR', 
          message: 'PDF გენერაცია ვერ მოხერხდა',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}
