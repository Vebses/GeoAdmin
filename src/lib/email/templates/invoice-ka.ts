// Georgian invoice email template

export const invoiceEmailTemplateKA = {
  subject: 'ინვოისი #{invoiceNumber} ქეისის #{caseNumber} თაობაზე',
  
  body: `პატივცემულო პარტნიორო,

გთხოვთ იხილოთ თანდართული ინვოისი #{invoiceNumber} გაწეული სამედიცინო დახმარების მომსახურებისთვის.

ქეისის დეტალები:
- ქეისის ნომერი: #{caseNumber}
- პაციენტი: {patientName}
- მომსახურების თარიღი: {invoiceDate}

ინვოისის შეჯამება:
- ჯამი: {subtotal}
- ფრანშიზა: {franchise}
- გადასახდელი: {total}

გადახდის რეკვიზიტები:
ბანკი: {bankName}
SWIFT: {bankCode}
IBAN: {iban}

გთხოვთ დაამუშავოთ ეს ინვოისი მიღებიდან 30 დღის განმავლობაში.

კითხვების შემთხვევაში, გთხოვთ დაგვიკავშირდეთ.`,

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

/**
 * Replace template variables with actual values
 */
export function applyTemplateKA(
  template: string,
  variables: Record<string, string | undefined>
): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined) {
      // Replace both #{var} and {var} patterns. Use a function replacer so the
      // value is inserted literally — free-form values (e.g. a signature, or the
      // USD "$" in a total) must not be interpreted as $-replacement patterns.
      result = result.replace(new RegExp(`#?\\{${key}\\}`, 'g'), () => value);
    }
  }
  
  return result;
}

export default invoiceEmailTemplateKA;
