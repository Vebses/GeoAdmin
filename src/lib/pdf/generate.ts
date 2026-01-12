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
  if (!url) {
    console.log('No image URL provided');
    return undefined;
  }
  
  console.log('Fetching image:', url);
  
  try {
    // For Supabase URLs, we might need to handle them differently
    const response = await fetch(url, {
      headers: {
        'Accept': 'image/*',
      },
      // Don't follow redirects automatically for debugging
      redirect: 'follow',
    });
    
    console.log('Image fetch response:', response.status, response.statusText);
    
    if (!response.ok) {
      console.warn(`Failed to fetch image (${response.status}): ${url}`);
      return undefined;
    }
    
    const contentType = response.headers.get('content-type');
    console.log('Image content type:', contentType);
    
    if (!contentType?.startsWith('image/')) {
      console.warn(`Invalid content type for image: ${contentType}`);
      return undefined;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    console.log('Image fetched successfully, size:', buffer.length, 'bytes');
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error(`Error fetching image ${url}:`, error);
    return undefined;
  }
}

/**
 * Generate PDF buffer from invoice data
 */
export async function generateInvoicePDF(options: GeneratePDFOptions): Promise<Buffer> {
  const { invoice, sender, recipient, caseData, language = 'en' } = options;

  console.log('Generating PDF for invoice:', invoice.invoice_number);
  console.log('Sender logo URL:', sender.logo_url);
  console.log('Sender signature URL:', sender.signature_url);
  console.log('Sender stamp URL:', sender.stamp_url);

  // Ensure fonts are registered before rendering
  registerFonts();

  // Fetch company images as base64 in parallel
  const [logoBase64, signatureBase64, stampBase64] = await Promise.all([
    fetchImageAsBase64(sender.logo_url),
    fetchImageAsBase64(sender.signature_url),
    fetchImageAsBase64(sender.stamp_url),
  ]);

  console.log('Logo fetched:', !!logoBase64);
  console.log('Signature fetched:', !!signatureBase64);
  console.log('Stamp fetched:', !!stampBase64);

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

  console.log('PDF generated, size:', pdfBuffer.length, 'bytes');

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
