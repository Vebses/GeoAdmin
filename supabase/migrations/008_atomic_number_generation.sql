-- Migration: Add atomic case number generation function
-- This prevents race conditions when multiple cases are created simultaneously

-- Generate next case number atomically
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TEXT AS $$
DECLARE
  v_current_year TEXT;
  v_next_sequence INTEGER;
  v_case_number TEXT;
BEGIN
  -- Get current year
  v_current_year := TO_CHAR(NOW(), 'YYYY');

  -- Get next sequence number for this year with row-level locking
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(c.case_number FROM 10 FOR 4) AS INTEGER
    )
  ), 0) + 1
  INTO v_next_sequence
  FROM cases c
  WHERE c.case_number LIKE 'GEO-' || v_current_year || '-%'
  FOR UPDATE;

  -- Format case number: GEO-YYYY-0001
  v_case_number := 'GEO-' || v_current_year || '-' || LPAD(v_next_sequence::TEXT, 4, '0');

  RETURN v_case_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing invoice function to allow parameter rename
DROP FUNCTION IF EXISTS generate_invoice_number(UUID);

-- Update generate_invoice_number to use row-level locking for atomicity
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

  -- Get next sequence number with row-level locking for atomicity
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(i.invoice_number FROM LENGTH(v_company_prefix) + 9 FOR 4) AS INTEGER
    )
  ), 0) + 1
  INTO v_next_sequence
  FROM invoices i
  WHERE i.invoice_number LIKE v_company_prefix || '-' || v_year_month || '-%'
  FOR UPDATE;

  -- Format invoice number: PREFIX-YYYYMM-0001
  v_invoice_number := v_company_prefix || '-' || v_year_month || '-' || LPAD(v_next_sequence::TEXT, 4, '0');

  RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_case_number() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invoice_number(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION generate_case_number IS 'Generates the next case number atomically to prevent race conditions';
