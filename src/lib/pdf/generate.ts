import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import type { SupabaseClient } from '@supabase/supabase-js';
import { InvoicePDF } from './invoice-template';
import { registerFonts } from './fonts';
import { extractStoragePath } from '@/lib/storage-urls';
import type { InvoiceWithRelations, OurCompany, Partner, CaseWithRelations, InvoiceLanguage } from '@/types';

interface GeneratePDFOptions {
  invoice: InvoiceWithRelations;
  sender: OurCompany;
  recipient: Partner;
  caseData: CaseWithRelations;
  language?: InvoiceLanguage;
  /** Optional Supabase client — when provided, company images are downloaded
   *  directly from storage by path. Without it, falls back to HTTP fetch on a URL. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase?: SupabaseClient<any, 'public', any>;
}

const COMPANY_IMAGE_BUCKET = 'geoadmin-files';

/**
 * Resolve a stored image reference (storage path OR full URL) to a base64 data URI.
 * Prefers direct storage download via the Supabase client (works for paths and avoids
 * dealing with signed-URL expiry). Falls back to HTTP fetch if no client provided.
 */
async function imageToBase64(
  ref: string | null | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase?: SupabaseClient<any, 'public', any>
): Promise<string | undefined> {
  if (!ref) return undefined;

  const isFullUrl = /^https?:\/\//i.test(ref);

  // Prefer storage download when we have a client and a resolvable path
  if (supabase) {
    const path = extractStoragePath(ref);
    if (path) {
      try {
        const { data, error } = await supabase.storage.from(COMPANY_IMAGE_BUCKET).download(path);
        if (error || !data) {
          console.warn(`Storage download failed for ${path}:`, error);
        } else {
          const buffer = Buffer.from(await data.arrayBuffer());
          const contentType = data.type || 'image/png';
          return `data:${contentType};base64,${buffer.toString('base64')}`;
        }
      } catch (err) {
        console.error(`Error downloading image from storage ${path}:`, err);
      }
    }
  }

  // Fallback: HTTP fetch — only meaningful if `ref` is a full URL
  if (!isFullUrl) return undefined;
  try {
    const response = await fetch(ref, { headers: { Accept: 'image/*' }, redirect: 'follow' });
    if (!response.ok) {
      console.warn(`Failed to fetch image (${response.status}): ${ref}`);
      return undefined;
    }
    const contentType = response.headers.get('content-type') || 'image/png';
    if (!contentType.startsWith('image/')) {
      console.warn(`Invalid content type for image: ${contentType}`);
      return undefined;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error(`Error fetching image ${ref}:`, error);
    return undefined;
  }
}

/**
 * Generate PDF buffer from invoice data
 */
export async function generateInvoicePDF(options: GeneratePDFOptions): Promise<Buffer> {
  const { invoice, sender, recipient, caseData, language = 'en', supabase } = options;

  // Ensure fonts are registered before rendering
  registerFonts();

  // Resolve company images to base64 (direct storage download when client is given,
  // otherwise HTTP fetch for legacy URL-shaped values).
  const [logoBase64, signatureBase64, stampBase64] = await Promise.all([
    imageToBase64(sender.logo_url, supabase),
    imageToBase64(sender.signature_url, supabase),
    imageToBase64(sender.stamp_url, supabase),
  ]);

  // Strip the raw path/URL out of the sender so the PDF template's fallback
  // (`logoBase64 || sender.logo_url`) doesn't end up handing react-pdf a bare path,
  // which would throw and fail the render. If the image fetch above failed, we
  // pass undefined and the template omits the image.
  const senderForPdf = {
    ...sender,
    logo_url: logoBase64 ? sender.logo_url : null,
    signature_url: signatureBase64 ? sender.signature_url : null,
    stamp_url: stampBase64 ? sender.stamp_url : null,
  };

  const pdfElement = React.createElement(InvoicePDF, {
    invoice,
    sender: senderForPdf,
    recipient,
    caseData,
    language,
    logoBase64,
    signatureBase64,
    stampBase64,
  });

  try {
    const pdfBuffer = await renderToBuffer(pdfElement);
    return Buffer.from(pdfBuffer);
  } catch (renderError) {
    console.error('renderToBuffer failed:', renderError);
    throw new Error(`PDF render failed: ${renderError instanceof Error ? renderError.message : 'Unknown render error'}`);
  }
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
