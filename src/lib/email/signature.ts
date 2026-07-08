// Personalised invoice-email sign-off, dependent on the case manager.
//
// The block returned here is what appears under "Best regards," /
// "პატივისცემით," at the bottom of an invoice email. It is dynamic per case:
// the manager is the user assigned to the invoice's case (cases.assigned_to).

// Subset of the users row the signature needs. The invoice send/preview routes
// embed exactly these columns off cases.assigned_to.
export interface SignatureManager {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  job_title?: string | null;
  email_signature?: string | null;
}

// Subset of the our_companies row used for the company footer / legacy fallback.
export interface SignatureCompany {
  name?: string | null;
  legal_name?: string | null;
  email?: string | null;
  phone?: string | null;
}

/**
 * Build the sign-off block that closes an invoice email.
 *
 * Priority:
 *   1. manager.email_signature (free-form) — used verbatim; the manager fully
 *      controls the wording, so nothing is appended.
 *   2. auto-composed from the manager's name / job title / phone / email,
 *      followed by the company name.
 *   3. no manager assigned — fall back to the company sign-off (the legacy
 *      behaviour: company name, legal name, email, phone).
 */
export function buildManagerSignature(
  manager: SignatureManager | null | undefined,
  company: SignatureCompany | null | undefined,
): string {
  const companyName = company?.legal_name?.trim() || company?.name?.trim() || '';

  // 1. Free-form override — verbatim, fully manager-controlled.
  const custom = manager?.email_signature?.trim();
  if (custom) return custom;

  // 2. Auto-compose from the manager's profile, then the company name line.
  const managerName = manager?.full_name?.trim();
  if (managerName) {
    const lines: string[] = [managerName];
    const title = manager?.job_title?.trim();
    if (title) lines.push(title);
    const phone = manager?.phone?.trim();
    if (phone) lines.push(phone);
    const email = manager?.email?.trim();
    if (email) lines.push(email);
    if (companyName) lines.push(companyName);
    return lines.join('\n');
  }

  // 3. No manager on the case — legacy company sign-off.
  const senderName = company?.name?.trim();
  const lines: string[] = [];
  if (senderName) lines.push(senderName);
  if (companyName && companyName !== senderName) lines.push(companyName);
  const companyEmail = company?.email?.trim();
  if (companyEmail) lines.push(companyEmail);
  const companyPhone = company?.phone?.trim();
  if (companyPhone) lines.push(companyPhone);
  return lines.join('\n');
}

// Sign-off label per language ("Best regards," / "პატივისცემით,"). Lives here
// (dependency-free) so both the server (send.ts) and client (send dialog
// preview) can share the same strip logic.
export const SIGN_OFF_LABELS: Record<string, string> = {
  en: 'Best regards',
  ka: 'პატივისცემით',
};

/**
 * Strip a trailing sign-off block from a message body before the fresh
 * case-manager sign-off is appended.
 *
 * Message bodies are signature-free by design, but invoices saved before this
 * feature (and the old wizard template) baked a "Best regards, <company>" block
 * into email_body. Without this, sending such an invoice would show two
 * sign-offs. Conservative on purpose: only cuts from the LAST line that is
 * exactly a known sign-off label, and only when the tail is a short block (a
 * signature, not prose), so it never eats a real paragraph. Used identically on
 * the server (before send) and the client (send-dialog preview) so the preview
 * always matches what is actually sent.
 */
export function stripTrailingSignOff(body: string): string {
  const labelLine = new Set(Object.values(SIGN_OFF_LABELS).map(l => `${l},`));
  const lines = body.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    if (labelLine.has(lines[i].trim())) {
      const nonEmptyTail = lines.slice(i).filter(l => l.trim()).length;
      if (nonEmptyTail <= 8) {
        return lines.slice(0, i).join('\n').trimEnd();
      }
      break;
    }
  }
  return body.trimEnd();
}
