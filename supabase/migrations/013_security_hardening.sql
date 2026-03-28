-- Migration 013: Security Hardening
-- Restricts overly permissive RLS policies on activity_logs and tightens partner/case/invoice write access

-- ============================================
-- 1. ACTIVITY LOGS: Restrict SELECT to admins, restrict INSERT to owner
-- ============================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Anyone can view activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "System can insert activity_logs" ON public.activity_logs;

-- Only managers/super_admins can read activity logs
CREATE POLICY "Admins can view activity_logs" ON public.activity_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'manager')
        )
    );

-- Users can only insert logs for themselves (user_id must match auth.uid or be null for system)
CREATE POLICY "Users can insert own activity_logs" ON public.activity_logs
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- ============================================
-- 2. PARTNERS: Restrict write to admins only
-- ============================================

DROP POLICY IF EXISTS "Anyone can manage partners" ON public.partners;

-- Admins can manage partners
CREATE POLICY "Admins can manage partners" ON public.partners
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'manager')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'manager')
        )
    );

-- Keep read access for all authenticated users (needed for dropdowns)
CREATE POLICY "Authenticated users can view active partners" ON public.partners
    FOR SELECT TO authenticated
    USING (deleted_at IS NULL);

-- ============================================
-- 3. NOTIFICATIONS: Restrict INSERT to prevent fake notifications
-- ============================================

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Only allow inserting notifications where actor_id matches current user (or is null for system)
CREATE POLICY "Users can insert notifications as actor" ON public.notifications
    FOR INSERT TO authenticated
    WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);

-- ============================================
-- 4. Add indexes for trash queries (IS NOT NULL)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_cases_deleted_items ON public.cases(deleted_at DESC)
    WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_deleted_items ON public.invoices(deleted_at DESC)
    WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_partners_deleted_items ON public.partners(deleted_at DESC)
    WHERE deleted_at IS NOT NULL;

-- ============================================
-- 5. Add missing indexes for common query patterns
-- ============================================

CREATE INDEX IF NOT EXISTS idx_cases_insurance ON public.cases(insurance_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_cases_created ON public.cases(created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_currency ON public.invoices(currency)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_cases_assigned_status ON public.cases(assigned_to, status)
    WHERE deleted_at IS NULL;
