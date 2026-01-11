-- ============================================
-- FIX: RLS Infinite Recursion
-- ============================================
-- Problem: Policies that check "SELECT FROM users WHERE role = 'manager'"
-- cause infinite recursion because that SELECT triggers RLS on users table.
-- Solution: Use SECURITY DEFINER function that bypasses RLS.
-- ============================================

-- Create a security definer function to check manager role
-- This function bypasses RLS when checking the user's role
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'manager'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_manager() TO authenticated;

-- ============================================
-- Drop problematic policies
-- ============================================

DROP POLICY IF EXISTS "Managers can manage users" ON public.users;
DROP POLICY IF EXISTS "Managers can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Managers can manage companies" ON public.our_companies;
DROP POLICY IF EXISTS "Managers can view settings" ON public.settings;
DROP POLICY IF EXISTS "Managers can update settings" ON public.settings;

-- ============================================
-- Recreate policies using the SECURITY DEFINER function
-- ============================================

-- Users - managers can manage all users
CREATE POLICY "Managers can manage users" ON public.users 
    FOR ALL TO authenticated 
    USING (public.is_manager());

-- Categories - managers can manage categories
CREATE POLICY "Managers can manage categories" ON public.categories 
    FOR ALL TO authenticated 
    USING (public.is_manager());

-- Our Companies - managers can manage companies  
CREATE POLICY "Managers can manage companies" ON public.our_companies 
    FOR ALL TO authenticated 
    USING (public.is_manager());

-- Settings - managers can view and update
CREATE POLICY "Managers can view settings" ON public.settings 
    FOR SELECT TO authenticated 
    USING (public.is_manager());

CREATE POLICY "Managers can update settings" ON public.settings 
    FOR UPDATE TO authenticated 
    USING (public.is_manager());

-- ============================================
-- Ensure basic SELECT policies exist (for non-managers)
-- ============================================

-- Make sure everyone can view categories (needed for dropdowns)
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories" ON public.categories 
    FOR SELECT TO authenticated 
    USING (true);

-- Make sure everyone can view active companies
DROP POLICY IF EXISTS "Anyone can view active companies" ON public.our_companies;
CREATE POLICY "Anyone can view active companies" ON public.our_companies 
    FOR SELECT TO authenticated 
    USING (deleted_at IS NULL);
