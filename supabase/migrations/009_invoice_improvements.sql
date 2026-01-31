-- Migration: Invoice Module Improvements
-- Fixes for: Issue #12 (RLS), Issue #14 (franchise naming consistency)

-- ============================================
-- Issue #14: Add franchise column alias for consistency
-- The database uses 'franchise' but code sometimes uses 'franchise_amount'
-- We'll create a generated column as an alias for backwards compatibility
-- ============================================

-- First, check if we need to add franchise column or rename
-- The column should be 'franchise' in the database
DO $$
BEGIN
  -- If franchise_amount exists but franchise doesn't, rename it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'franchise_amount'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'franchise'
  ) THEN
    ALTER TABLE invoices RENAME COLUMN franchise_amount TO franchise;
  END IF;
END $$;

-- ============================================
-- Issue #12: Improved RLS Policies (optional - commented out)
-- These are more restrictive policies that can be enabled if needed
-- Currently all authenticated users have full access
-- ============================================

-- NOTE: The following policies are commented out because they require
-- the users table to have a 'role' column. Enable these if you want
-- role-based access control for invoices.

/*
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can view active invoices" ON invoices;
DROP POLICY IF EXISTS "Anyone can manage invoices" ON invoices;

-- Create more restrictive policies based on user roles
-- Assumes users table has a 'role' column with values: 'super_admin', 'manager', 'accountant', 'assistant'

-- All authenticated users can view non-deleted invoices
CREATE POLICY "Authenticated users can view invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Only managers and above can create invoices
CREATE POLICY "Managers can create invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'manager')
    )
  );

-- Only the creator or managers can update invoices
CREATE POLICY "Creators and managers can update invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'manager')
    )
  );

-- Only super_admin can delete (soft delete) invoices
CREATE POLICY "Super admins can delete invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );
*/

-- ============================================
-- Add index for common invoice queries
-- ============================================

-- Index for filtering by status and date
CREATE INDEX IF NOT EXISTS idx_invoices_status_created
  ON invoices(status, created_at DESC)
  WHERE deleted_at IS NULL;

-- Index for filtering by recipient
CREATE INDEX IF NOT EXISTS idx_invoices_recipient_status
  ON invoices(recipient_id, status)
  WHERE deleted_at IS NULL;

-- Index for filtering by sender
CREATE INDEX IF NOT EXISTS idx_invoices_sender_status
  ON invoices(sender_id, status)
  WHERE deleted_at IS NULL;

-- ============================================
-- Add constraint to prevent negative totals
-- ============================================

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_total_non_negative;
ALTER TABLE invoices ADD CONSTRAINT invoices_total_non_negative CHECK (total >= 0);

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_subtotal_non_negative;
ALTER TABLE invoices ADD CONSTRAINT invoices_subtotal_non_negative CHECK (subtotal >= 0);

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_franchise_non_negative;
ALTER TABLE invoices ADD CONSTRAINT invoices_franchise_non_negative CHECK (franchise >= 0 OR franchise IS NULL);

-- Add comment for documentation
COMMENT ON COLUMN invoices.franchise IS 'Franchise/discount amount to be deducted from subtotal. Also known as franchise_amount in some parts of the codebase.';
