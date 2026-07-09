-- ============================================
-- Per-company email signature block
-- ============================================
-- The invoice-email sign-off is: <case manager full name> / <position> /
-- <company block>. The company block (name, address, E-mail/Tel/Mobile lines,
-- with the exact wording each sender uses) can't be assembled from the existing
-- structured columns — our_companies has a single `phone`, no `mobile`, and no
-- label formatting. So it is stored as a free-form template per company and the
-- manager's name + job_title are prepended at send time
-- (see src/lib/email/signature.ts). Falls back to name/email/phone when unset.

ALTER TABLE public.our_companies
    ADD COLUMN IF NOT EXISTS email_signature TEXT;

ALTER TABLE public.our_companies
    DROP CONSTRAINT IF EXISTS our_companies_email_signature_len;
ALTER TABLE public.our_companies
    ADD CONSTRAINT our_companies_email_signature_len
    CHECK (email_signature IS NULL OR char_length(email_signature) <= 2000);
