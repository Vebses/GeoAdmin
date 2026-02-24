-- Migration: Fix case number generation - FOR UPDATE not allowed with aggregates
-- Use advisory lock instead for atomic operation
--
-- Error that this fixes:
--   code: '0A000'
--   message: 'FOR UPDATE is not allowed with aggregate functions'

CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TEXT AS $$
DECLARE
  v_current_year TEXT;
  v_next_sequence INTEGER;
  v_case_number TEXT;
BEGIN
  -- Get current year
  v_current_year := TO_CHAR(NOW(), 'YYYY');

  -- Advisory lock prevents race conditions without FOR UPDATE
  -- hashtext creates a consistent lock key from the string
  PERFORM pg_advisory_xact_lock(hashtext('case_number_' || v_current_year));

  -- Get next sequence number for this year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(c.case_number FROM 10 FOR 4) AS INTEGER)
  ), 0) + 1
  INTO v_next_sequence
  FROM cases c
  WHERE c.case_number LIKE 'GEO-' || v_current_year || '-%';

  -- Format case number: GEO-YYYY-0001
  v_case_number := 'GEO-' || v_current_year || '-' || LPAD(v_next_sequence::TEXT, 4, '0');

  RETURN v_case_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix generate_invoice_number which has the same issue
CREATE OR REPLACE FUNCTION generate_invoice_number(company_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_company_prefix TEXT;
  v_year_month TEXT;
  v_next_sequence INTEGER;
  v_invoice_number TEXT;
BEGIN
  -- Get company prefix
  SELECT COALESCE(oc.invoice_prefix, 'INV')
  INTO v_company_prefix
  FROM our_companies oc
  WHERE oc.id = company_id;

  -- Default prefix if company not found
  IF v_company_prefix IS NULL THEN
    v_company_prefix := 'INV';
  END IF;

  -- Get current year-month
  v_year_month := TO_CHAR(NOW(), 'YYYYMM');

  -- Advisory lock prevents race conditions
  PERFORM pg_advisory_xact_lock(hashtext('invoice_' || v_company_prefix || '_' || v_year_month));

  -- Get next sequence number
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(i.invoice_number FROM LENGTH(v_company_prefix) + 9 FOR 4) AS INTEGER)
  ), 0) + 1
  INTO v_next_sequence
  FROM invoices i
  WHERE i.invoice_number LIKE v_company_prefix || '-' || v_year_month || '-%';

  -- Format invoice number: PREFIX-YYYYMM-0001
  v_invoice_number := v_company_prefix || '-' || v_year_month || '-' || LPAD(v_next_sequence::TEXT, 4, '0');

  RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions (already exist but ensure they're set)
GRANT EXECUTE ON FUNCTION generate_case_number() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invoice_number(UUID) TO authenticated;
