// Personalised invoice-email sign-off, dependent on the case manager.
//
// The block returned here is what appears under "Best regards," /
// "პატივისცემით," at the bottom of an invoice email. It is dynamic per case:
// the manager is the user assigned to the invoice's case (cases.assigned_to).

// Subset of the users row the signature needs. The invoice send/preview routes
// embed exactly these columns off cases.assigned_to.
export interface SignatureManager {
  full_name?: string | null;
  job_title?: string | null;
}

// Subset of the our_companies row used for the company block.
export interface SignatureCompany {
  name?: string | null;
  legal_name?: string | null;
  email?: string | null;
  phone?: string | null;
  // Free-form per-company signature block (address, E-mail/Tel/Mobile lines, …),
  // edited in Company settings.
  email_signature?: string | null;
}

/**
 * The company block that closes the signature — the sender company's details.
 * Prefers the free-form per-company template (`our_companies.email_signature`);
 * falls back to auto-composing from the structured fields when it isn't set.
 */
function resolveCompanyBlock(company: SignatureCompany | null | undefined): string {
  const template = company?.email_signature?.trim();
  if (template) return template;

  // Fallback: legal/short name, email, phone.
  const companyName = company?.legal_name?.trim() || company?.name?.trim() || '';
  const lines: string[] = [];
  if (companyName) lines.push(companyName);
  const email = company?.email?.trim();
  if (email) lines.push(email);
  const phone = company?.phone?.trim();
  if (phone) lines.push(phone);
  return lines.join('\n');
}

/**
 * Build the sign-off block that closes an invoice email:
 *
 *   <case manager full name>   ← dynamic, per assigned manager
 *   <case manager position>    ← dynamic (users.job_title)
 *   <company block>            ← per-company template (our_companies.email_signature)
 *
 * When the case has no assigned manager, only the company block is returned.
 */
export function buildManagerSignature(
  manager: SignatureManager | null | undefined,
  company: SignatureCompany | null | undefined,
): string {
  const companyBlock = resolveCompanyBlock(company);

  // Manager present: name + position on top, then the company block.
  const managerName = manager?.full_name?.trim();
  if (managerName) {
    const lines: string[] = [managerName];
    const title = manager?.job_title?.trim();
    if (title) lines.push(title);
    if (companyBlock) lines.push(companyBlock);
    return lines.join('\n');
  }

  // No manager on the case — just the company block.
  return companyBlock;
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
