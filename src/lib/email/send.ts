import { Resend } from 'resend';
import { invoiceEmailTemplateEN, applyTemplateEN } from './templates/invoice-en';
import { invoiceEmailTemplateKA, applyTemplateKA } from './templates/invoice-ka';
import { buildManagerSignature, stripTrailingSignOff, SIGN_OFF_LABELS } from './signature';
import type { InvoiceWithRelations, OurCompany, Partner, CaseWithRelations, InvoiceLanguage, CurrencyCode } from '@/types';

// Initialize Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// Currency formatting
const currencySymbols: Record<CurrencyCode, string> = {
  GEL: '₾',
  EUR: '€',
  USD: '$',
};

function formatCurrency(amount: number, currency: CurrencyCode): string {
  const symbol = currencySymbols[currency] || currency;
  return `${amount.toFixed(2)} ${symbol}`;
}

function formatDate(dateStr: string, _language: InvoiceLanguage): string {
  // Always use dd/MM/yyyy for consistency across app
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

interface Attachment {
  filename: string;
  content: Buffer;
}

interface SendInvoiceEmailParams {
  invoice: InvoiceWithRelations;
  sender: OurCompany;
  recipient: Partner;
  caseData: CaseWithRelations;
  pdfBuffer: Buffer;
  to?: string;
  cc?: string[];
  subject?: string;
  body?: string;
  additionalAttachments?: Attachment[];
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Get bank account based on currency
 */
function getBankAccount(sender: OurCompany, currency: CurrencyCode): string {
  switch (currency) {
    case 'GEL': return sender.account_gel || '';
    case 'USD': return sender.account_usd || '';
    case 'EUR':
    default: return sender.account_eur || '';
  }
}

/**
 * Prepare template variables
 */
function prepareVariables(
  invoice: InvoiceWithRelations,
  sender: OurCompany,
  recipient: Partner,
  caseData: CaseWithRelations
): Record<string, string> {
  const currency = invoice.currency as CurrencyCode;
  const language = invoice.language as InvoiceLanguage;
  
  const services = invoice.services || [];
  const subtotal = services.reduce((sum, s) => sum + ((s as any).amount || s.total || 0), 0);
  const franchise = (invoice as any).franchise || 0;
  const total = subtotal - franchise;

  return {
    invoiceNumber: invoice.invoice_number,
    caseNumber: caseData.case_number,
    patientName: caseData.patient_name,
    invoiceDate: formatDate(invoice.created_at, language),
    subtotal: formatCurrency(subtotal, currency),
    franchise: franchise > 0 ? formatCurrency(franchise, currency) : '-',
    total: formatCurrency(total, currency),
    currency: currency,
    bankName: sender.bank_name || '',
    bankCode: sender.bank_code || '',
    iban: getBankAccount(sender, currency),
    senderName: sender.name,
    companyName: sender.legal_name || sender.name,
    companyEmail: sender.email || '',
    companyPhone: sender.phone || '',
    recipientName: recipient.name,
  };
}

/**
 * Build the sign-off block appended to the bottom of an invoice email:
 *
 *   <closing>,                 ← "Kind regards," (en) / "პატივისცემით," (ka)
 *   <case manager full name> / <position> / <company block>
 *
 * Resolved at SEND/PREVIEW time from the case's currently assigned manager
 * (cases.assigned_to) and the sender company's signature template, so it always
 * reflects who manages the case now — never a value frozen into a saved body.
 * Falls back to the company block alone when the case has no manager.
 */
export function buildEmailSignOff(
  sender: OurCompany,
  caseData: CaseWithRelations,
  language: InvoiceLanguage,
): string {
  const label = SIGN_OFF_LABELS[language] || SIGN_OFF_LABELS.en;
  const signature = buildManagerSignature(caseData.assigned_user ?? null, sender);
  return signature ? `${label},\n${signature}` : `${label},`;
}

/**
 * Get default email subject and body based on language
 */
export function getDefaultEmailContent(
  invoice: InvoiceWithRelations,
  sender: OurCompany,
  recipient: Partner,
  caseData: CaseWithRelations
): { subject: string; body: string } {
  const language = invoice.language as InvoiceLanguage;
  const variables = prepareVariables(invoice, sender, recipient, caseData);
  
  if (language === 'ka') {
    return {
      subject: applyTemplateKA(invoiceEmailTemplateKA.subject, variables),
      body: applyTemplateKA(invoiceEmailTemplateKA.body, variables),
    };
  }
  
  return {
    subject: applyTemplateEN(invoiceEmailTemplateEN.subject, variables),
    body: applyTemplateEN(invoiceEmailTemplateEN.body, variables),
  };
}

/**
 * Send invoice email
 */
export async function sendInvoiceEmail({
  invoice,
  sender,
  recipient,
  caseData,
  pdfBuffer,
  to,
  cc,
  subject,
  body,
  additionalAttachments = [],
}: SendInvoiceEmailParams): Promise<SendEmailResult> {
  try {
    const resend = getResendClient();
    
    // Get email content
    const defaultContent = getDefaultEmailContent(invoice, sender, recipient, caseData);
    const emailSubject = subject || invoice.email_subject || defaultContent.subject;
    const messageBody = stripTrailingSignOff(body || invoice.email_body || defaultContent.body);

    // Append the case-manager sign-off as a footer, resolved fresh at send time.
    // Bodies (default template, wizard, user-edited) carry only the message; the
    // signature is never baked into a saved body, so it can't go stale.
    const language = (invoice.language as InvoiceLanguage) || 'en';
    const signOff = buildEmailSignOff(sender, caseData, language);
    const emailBody = signOff ? `${messageBody}\n\n${signOff}` : messageBody;

    // Prepare recipient email
    const recipientEmail = to || invoice.recipient_email || recipient.email;
    if (!recipientEmail) {
      throw new Error('No recipient email address');
    }
    
    // Prepare from address - the selected our_company's email is the primary source.
    // Falls back to env / hardcoded only if the company has no email configured.
    const fromEmail = sender.email || process.env.RESEND_FROM_EMAIL || 'invoices@geoadmin.ge';
    const fromName = sender.name || process.env.RESEND_FROM_NAME || 'GeoAdmin';
    
    // Prepare attachments
    const attachments = [
      {
        filename: `Invoice-${invoice.invoice_number}.pdf`,
        content: pdfBuffer,
      },
      ...additionalAttachments,
    ];
    
    // Send email
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: recipientEmail,
      cc: cc || invoice.cc_emails || [],
      reply_to: sender.email || undefined,
      subject: emailSubject,
      text: emailBody,
      attachments: attachments.map(a => ({
        filename: a.filename,
        content: a.content,
      })),
    });
    
    if (error) {
      console.error('Resend error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
    
    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error('Send email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Parse comma-separated emails
 */
export function parseEmails(emailString: string): string[] {
  return emailString
    .split(/[,;]/)
    .map(e => e.trim())
    .filter(e => isValidEmail(e));
}
