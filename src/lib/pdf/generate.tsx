import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePDF } from './invoice-template';
import type { InvoiceWithRelations, OurCompany, Partner, CaseWithRelations, InvoiceLanguage } from '@/types';

interface GeneratePDFOptions {
  invoice: InvoiceWithRelations;
  sender: OurCompany;
  recipient: Partner;
  caseData: CaseWithRelations;
  language?: InvoiceLanguage;
}

/**
 * Generate PDF buffer from invoice data
 */
export async function generateInvoicePDF(options: GeneratePDFOptions): Promise<Buffer> {
  const { invoice, sender, recipient, caseData, language = 'en' } = options;

  const pdfBuffer = await renderToBuffer(
    <InvoicePDF
      invoice={invoice}
      sender={sender}
      recipient={recipient}
      caseData={caseData}
      language={language}
    />
  );

  return Buffer.from(pdfBuffer);
}

/**
 * Generate PDF filename
 */
export function generatePDFFilename(invoiceNumber: string, language: InvoiceLanguage = 'en'): string {
  const prefix = language === 'ka' ? 'ინვოისი' : 'Invoice';
  const sanitized = invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '_');
  return `${prefix}-${sanitized}.pdf`;
}

/**
 * Get Content-Disposition header value
 */
export function getContentDisposition(filename: string, inline = false): string {
  const type = inline ? 'inline' : 'attachment';
  // Encode filename for non-ASCII characters
  const encodedFilename = encodeURIComponent(filename);
  return `${type}; filename="${filename}"; filename*=UTF-8''${encodedFilename}`;
}
