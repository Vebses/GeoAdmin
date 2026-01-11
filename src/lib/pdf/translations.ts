// PDF translations for invoice documents
export const pdfTranslations = {
  en: {
    invoice: 'INVOICE',
    date: 'Date',
    case: 'Case',
    from: 'From',
    to: 'Bill To',
    idCode: 'ID',
    patient: 'Patient',
    patientInfo: 'Patient Information',
    personalId: 'Personal ID',
    reference: 'Reference',
    service: 'Service Description',
    qty: 'Qty',
    unitPrice: 'Unit Price',
    amount: 'Amount',
    subtotal: 'Subtotal',
    franchise: 'Franchise (Deductible)',
    total: 'Total Due',
    bankDetails: 'Bank Details',
    bankName: 'Bank Name',
    swiftBic: 'SWIFT/BIC',
    account: 'Account',
    signature: 'Authorized Signature',
    stamp: 'Company Seal',
    thankYou: 'Thank you for your business',
    paymentTerms: 'Please process this invoice within 30 days of receipt.',
  },
  ka: {
    invoice: 'ინვოისი',
    date: 'თარიღი',
    case: 'ქეისი',
    from: 'გამომგზავნი',
    to: 'მიმღები',
    idCode: 'საიდ. კოდი',
    patient: 'პაციენტი',
    patientInfo: 'პაციენტის ინფორმაცია',
    personalId: 'პირადი ნომერი',
    reference: 'რეფერენსი',
    service: 'სერვისის აღწერა',
    qty: 'რაოდ.',
    unitPrice: 'ერთ. ფასი',
    amount: 'თანხა',
    subtotal: 'ჯამი',
    franchise: 'ფრანშიზა',
    total: 'გადასახდელი',
    bankDetails: 'საბანკო რეკვიზიტები',
    bankName: 'ბანკი',
    swiftBic: 'SWIFT/BIC',
    account: 'ანგარიში',
    signature: 'ხელმოწერა',
    stamp: 'ბეჭედი',
    thankYou: 'მადლობა თანამშრომლობისთვის',
    paymentTerms: 'გთხოვთ დაამუშაოთ ეს ინვოისი მიღებიდან 30 დღის განმავლობაში.',
  },
} as const;

export type InvoiceLanguage = keyof typeof pdfTranslations;
export type TranslationKey = keyof typeof pdfTranslations.en;

export function getTranslation(language: InvoiceLanguage, key: TranslationKey): string {
  return pdfTranslations[language][key];
}
