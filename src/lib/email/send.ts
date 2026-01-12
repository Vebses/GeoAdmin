import { Resend } from 'resend';
import { invoiceEmailTemplateEN, applyTemplateEN } from './templates/invoice-en';
import { invoiceEmailTemplateKA, applyTemplateKA } from './templates/invoice-ka';
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

function formatDate(dateStr: string, language: InvoiceLanguage): string {
  const date = new Date(dateStr);
  if (language === 'ka') {
    return date.toLocaleDateString('ka-GE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
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
    const emailBody = body || invoice.email_body || defaultContent.body;
    
    // Prepare recipient email
    const recipientEmail = to || invoice.recipient_email || recipient.email;
    if (!recipientEmail) {
      throw new Error('No recipient email address');
    }
    
    // Prepare from address - use verified domain
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'invoices@geoadmin.ge';
    const fromName = process.env.RESEND_FROM_NAME || sender.name;
    
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
