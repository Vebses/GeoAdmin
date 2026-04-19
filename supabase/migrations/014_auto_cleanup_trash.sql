-- Migration 014: Auto-cleanup of soft-deleted items older than 30 days
-- Creates a SECURITY DEFINER function that purges old trashed items.
-- Cascades to related rows (case_actions, case_documents, invoice_services, invoice_sends)
-- via foreign key ON DELETE CASCADE rules.

CREATE OR REPLACE FUNCTION public.cleanup_old_trash()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff timestamptz := now() - interval '30 days';
  deleted_cases int := 0;
  deleted_invoices int := 0;
  deleted_partners int := 0;
  deleted_companies int := 0;
  orphan_case_actions int := 0;
  orphan_case_documents int := 0;
  case_ids uuid[];
  invoice_ids uuid[];
BEGIN
  -- Collect IDs of cases and invoices to be purged so we can clean up related rows first.
  SELECT COALESCE(array_agg(id), ARRAY[]::uuid[]) INTO case_ids
  FROM public.cases
  WHERE deleted_at IS NOT NULL AND deleted_at < cutoff;

  SELECT COALESCE(array_agg(id), ARRAY[]::uuid[]) INTO invoice_ids
  FROM public.invoices
  WHERE deleted_at IS NOT NULL AND deleted_at < cutoff;

  -- Pre-delete case-related rows if FK cascade isn't configured
  IF array_length(case_ids, 1) > 0 THEN
    DELETE FROM public.case_actions WHERE case_id = ANY(case_ids);
    GET DIAGNOSTICS orphan_case_actions = ROW_COUNT;

    DELETE FROM public.case_documents WHERE case_id = ANY(case_ids);
    GET DIAGNOSTICS orphan_case_documents = ROW_COUNT;
  END IF;

  -- Also clean up orphaned case_actions and case_documents (pointing to non-existent cases)
  DELETE FROM public.case_actions ca
  WHERE NOT EXISTS (SELECT 1 FROM public.cases c WHERE c.id = ca.case_id);

  DELETE FROM public.case_documents cd
  WHERE NOT EXISTS (SELECT 1 FROM public.cases c WHERE c.id = cd.case_id);

  -- Delete invoice-related rows if FK cascade isn't configured
  IF array_length(invoice_ids, 1) > 0 THEN
    DELETE FROM public.invoice_services WHERE invoice_id = ANY(invoice_ids);
    DELETE FROM public.invoice_sends WHERE invoice_id = ANY(invoice_ids);
  END IF;

  -- Clean up orphaned invoice_services and invoice_sends
  DELETE FROM public.invoice_services isv
  WHERE NOT EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = isv.invoice_id);

  DELETE FROM public.invoice_sends isn
  WHERE NOT EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = isn.invoice_id);

  -- Now purge the main entities
  DELETE FROM public.cases
  WHERE deleted_at IS NOT NULL AND deleted_at < cutoff;
  GET DIAGNOSTICS deleted_cases = ROW_COUNT;

  DELETE FROM public.invoices
  WHERE deleted_at IS NOT NULL AND deleted_at < cutoff;
  GET DIAGNOSTICS deleted_invoices = ROW_COUNT;

  DELETE FROM public.partners
  WHERE deleted_at IS NOT NULL AND deleted_at < cutoff;
  GET DIAGNOSTICS deleted_partners = ROW_COUNT;

  DELETE FROM public.our_companies
  WHERE deleted_at IS NOT NULL AND deleted_at < cutoff;
  GET DIAGNOSTICS deleted_companies = ROW_COUNT;

  RETURN jsonb_build_object(
    'cutoff', cutoff,
    'deleted_cases', deleted_cases,
    'deleted_invoices', deleted_invoices,
    'deleted_partners', deleted_partners,
    'deleted_companies', deleted_companies,
    'orphan_case_actions_removed', orphan_case_actions,
    'orphan_case_documents_removed', orphan_case_documents
  );
END;
$$;

-- Only authenticated users with the 'service_role' can call this (cron endpoint uses service role)
REVOKE ALL ON FUNCTION public.cleanup_old_trash() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_old_trash() TO service_role;

-- Optional: enable pg_cron and schedule daily run at 03:00 UTC
-- Only uncomment if pg_cron extension is available on your Supabase plan
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule(
--   'cleanup_old_trash_daily',
--   '0 3 * * *',
--   $$ SELECT public.cleanup_old_trash(); $$
-- );
