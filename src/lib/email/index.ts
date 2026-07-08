export {
  sendInvoiceEmail,
  getDefaultEmailContent,
  getDefaultEmailContent as getEmailContent,
  buildEmailSignOff,
  isValidEmail,
  parseEmails
} from './send';
export { buildManagerSignature, stripTrailingSignOff, SIGN_OFF_LABELS } from './signature';
export { invoiceEmailTemplateEN, applyTemplateEN, type EmailTemplateVariables } from './templates/invoice-en';
export { invoiceEmailTemplateKA, applyTemplateKA } from './templates/invoice-ka';
