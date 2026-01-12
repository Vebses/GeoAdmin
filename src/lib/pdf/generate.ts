import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePDF } from './invoice-template';
import { registerFonts } from './fonts';
import type { InvoiceWithRelations, OurCompany, Partner, CaseWithRelations, InvoiceLanguage } from '@/types';

interface GeneratePDFOptions {
  invoice: InvoiceWithRelations;
  sender: OurCompany;
  recipient: Partner;
  caseData: CaseWithRelations;
  language?: InvoiceLanguage;
}

/**
 * Fetch image and convert to base64 data URI
 */
async function fetchImageAsBase64(url: string | null | undefined): Promise<string | undefined> {
  if (!url) return undefined;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch image: ${url}`);
      return undefined;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    // Determine mime type
    const contentType = response.headers.get('content-type') || 'image/png';
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.warn(`Error fetching image ${url}:`, error);
    return undefined;
  }
}

/**
 * Generate PDF buffer from invoice data
 */
export async function generateInvoicePDF(options: GeneratePDFOptions): Promise<Buffer> {
  const { invoice, sender, recipient, caseData, language = 'en' } = options;

  // Ensure fonts are registered before rendering
  registerFonts();

  // Fetch company images as base64
  const [logoBase64, signatureBase64, stampBase64] = await Promise.all([
    fetchImageAsBase64(sender.logo_url),
    fetchImageAsBase64(sender.signature_url),
    fetchImageAsBase64(sender.stamp_url),
  ]);

  // Create the PDF element using createElement
  const pdfElement = React.createElement(InvoicePDF, {
    invoice,
    sender,
    recipient,
    caseData,
    language,
    logoBase64,
    signatureBase64,
    stampBase64,
  });

  // Render to buffer
  const pdfBuffer = await renderToBuffer(pdfElement);

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
