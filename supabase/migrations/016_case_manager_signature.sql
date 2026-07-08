-- ============================================
-- Case-manager email signature fields
-- ============================================
-- Invoice emails (POST /api/invoices/[id]/send) close with a sign-off block.
-- Previously that block was the sending company's static details. We now
-- personalise it with the case's assigned manager (cases.assigned_to -> users):
--   * job_title       — shown on the signature line under the manager's name
--   * email_signature — optional free-form override; when set it replaces the
--                       auto-composed name/title/phone/email block verbatim.
-- When neither is set the signature is auto-composed from the manager's
-- existing profile fields; when a case has no assigned manager the email falls
-- back to the company sign-off (see src/lib/email/signature.ts).

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS job_title TEXT,
    ADD COLUMN IF NOT EXISTS email_signature TEXT;

-- Length guards mirror the app-layer validation (defense in depth, consistent
-- with the invoice email_subject/email_body limits).
ALTER TABLE public.users
    DROP CONSTRAINT IF EXISTS users_job_title_len;
ALTER TABLE public.users
    ADD CONSTRAINT users_job_title_len
    CHECK (job_title IS NULL OR char_length(job_title) <= 100);

ALTER TABLE public.users
    DROP CONSTRAINT IF EXISTS users_email_signature_len;
ALTER TABLE public.users
    ADD CONSTRAINT users_email_signature_len
    CHECK (email_signature IS NULL OR char_length(email_signature) <= 2000);
