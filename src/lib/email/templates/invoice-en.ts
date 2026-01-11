// English invoice email template

export const invoiceEmailTemplateEN = {
  subject: 'Invoice #{invoiceNumber} for Case #{caseNumber}',
  
  body: `Dear Partner,

Please find attached the invoice #{invoiceNumber} for the medical assistance services provided.

Case Details:
- Case Number: #{caseNumber}
- Patient: {patientName}
- Service Date: {invoiceDate}

Invoice Summary:
- Subtotal: {subtotal}
- Franchise: {franchise}
- Total Due: {total}

Payment Details:
Bank: {bankName}
SWIFT: {bankCode}
IBAN: {iban}

Please process this invoice within 30 days of receipt.

If you have any questions regarding this invoice, please don't hesitate to contact us.

Best regards,
{senderName}
{companyName}
{companyEmail}
{companyPhone}`,

  // Available variables for template replacement
  variables: [
    'invoiceNumber',
    'caseNumber', 
    'patientName',
    'invoiceDate',
    'subtotal',
    'franchise',
    'total',
    'currency',
    'bankName',
    'bankCode',
    'iban',
    'senderName',
    'companyName',
    'companyEmail',
    'companyPhone',
    'recipientName',
  ] as const,
};

export type EmailTemplateVariables = {
  [K in typeof invoiceEmailTemplateEN.variables[number]]?: string;
};

/**
 * Replace template variables with actual values
 */
export function applyTemplateEN(
  template: string,
  variables: EmailTemplateVariables
): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined) {
      // Replace both #{var} and {var} patterns
      result = result.replace(new RegExp(`#?\\{${key}\\}`, 'g'), value);
    }
  }
  
  return result;
}

export default invoiceEmailTemplateEN;
