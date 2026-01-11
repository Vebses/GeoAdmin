-- Migration: Add RPC functions for invoice count management
-- Phase 7: Invoice Management

-- Increment case invoices_count
CREATE OR REPLACE FUNCTION increment_case_invoices_count(case_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE cases
  SET 
    invoices_count = COALESCE(invoices_count, 0) + 1,
    updated_at = NOW()
  WHERE id = case_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement case invoices_count
CREATE OR REPLACE FUNCTION decrement_case_invoices_count(case_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE cases
  SET 
    invoices_count = GREATEST(COALESCE(invoices_count, 0) - 1, 0),
    updated_at = NOW()
  WHERE id = case_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate next invoice number for a company
CREATE OR REPLACE FUNCTION generate_invoice_number(company_id UUID)
RETURNS TEXT AS $$
DECLARE
  company_prefix TEXT;
  year_month TEXT;
  next_sequence INTEGER;
  invoice_number TEXT;
BEGIN
  -- Get company prefix
  SELECT COALESCE(invoice_prefix, 'INV')
  INTO company_prefix
  FROM our_companies
  WHERE id = company_id;
  
  -- Default prefix if company not found
  IF company_prefix IS NULL THEN
    company_prefix := 'INV';
  END IF;
  
  -- Get current year-month
  year_month := TO_CHAR(NOW(), 'YYYYMM');
  
  -- Get next sequence number for this prefix and month
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(invoice_number FROM LENGTH(company_prefix) + 9 FOR 4)
      AS INTEGER
    )
  ), 0) + 1
  INTO next_sequence
  FROM invoices
  WHERE invoice_number LIKE company_prefix || '-' || year_month || '-%';
  
  -- Format invoice number: PREFIX-YYYYMM-0001
  invoice_number := company_prefix || '-' || year_month || '-' || LPAD(next_sequence::TEXT, 4, '0');
  
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION increment_case_invoices_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_case_invoices_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invoice_number(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION increment_case_invoices_count IS 'Increments the invoices_count on a case when a new invoice is created';
COMMENT ON FUNCTION decrement_case_invoices_count IS 'Decrements the invoices_count on a case when an invoice is deleted';
COMMENT ON FUNCTION generate_invoice_number IS 'Generates the next invoice number for a company based on prefix and current month';
