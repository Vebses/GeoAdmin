-- ============================================
-- Clamp invoice totals in the recompute trigger
-- ============================================
-- update_invoice_total() (001_initial_schema.sql) recomputes
-- invoices.subtotal/total on every invoice_services INSERT/UPDATE/DELETE
-- without clamping. On invoices with franchise > 0, deleting the service
-- rows (which the PUT /api/invoices/[id] route does before re-inserting the
-- edited set) transiently makes total = 0 - franchise < 0, violating the
-- invoices_total_non_negative CHECK (009_invoice_improvements.sql) and
-- aborting the delete. Clamp with GREATEST(..., 0), mirroring the
-- Math.max(0, ...) the API routes already apply when they write totals.

CREATE OR REPLACE FUNCTION update_invoice_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.invoices SET
        subtotal = GREATEST((
            SELECT COALESCE(SUM(amount), 0)
            FROM public.invoice_services WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
        ), 0),
        total = GREATEST((
            SELECT COALESCE(SUM(amount), 0)
            FROM public.invoice_services WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
        ) - COALESCE(franchise, 0), 0)
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
