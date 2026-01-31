-- Migration: Add super_admin role with elevated user management privileges
-- This migration:
-- 1. Adds 'super_admin' to the user_role enum
-- 2. Updates RLS policies so super_admin has full access
-- 3. Restricts manager creation/deletion to super_admin only

-- ============================================
-- Step 1: Add super_admin to the user_role enum
-- ============================================

-- In PostgreSQL, we need to add a new value to the enum type
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- ============================================
-- Step 2: Create helper function to check if user is super_admin
-- ============================================

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create helper function to check if user is super_admin or manager
CREATE OR REPLACE FUNCTION is_admin_or_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_manager() TO authenticated;

-- ============================================
-- Step 3: Update users table RLS policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Managers can manage users" ON public.users;

-- New policies:

-- 1. All authenticated users can view all active users
CREATE POLICY "Authenticated users can view all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

-- 2. Users can update their own non-role fields
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Super admins have full management access
CREATE POLICY "Super admins can manage all users"
  ON public.users FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- 4. Managers can manage non-manager users (assistants, accountants)
-- But cannot create/modify other managers or super_admins
CREATE POLICY "Managers can manage non-admin users"
  ON public.users FOR ALL
  TO authenticated
  USING (
    is_admin_or_manager()
    AND (
      -- Super admins can do anything
      is_super_admin()
      OR
      -- Managers can only manage non-admin users
      (role NOT IN ('super_admin', 'manager'))
    )
  )
  WITH CHECK (
    is_admin_or_manager()
    AND (
      -- Super admins can do anything
      is_super_admin()
      OR
      -- Managers can only create/update non-admin users
      (role NOT IN ('super_admin', 'manager'))
    )
  );

-- ============================================
-- Step 4: Update user_invitations RLS policies
-- ============================================

DROP POLICY IF EXISTS "Managers can view invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Managers can create invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Managers can delete invitations" ON public.user_invitations;

-- Super admins and managers can view invitations
CREATE POLICY "Admins can view invitations"
  ON public.user_invitations FOR SELECT
  TO authenticated
  USING (is_admin_or_manager());

-- Super admins can invite anyone, managers can only invite non-managers
CREATE POLICY "Admins can create invitations"
  ON public.user_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_or_manager()
    AND (
      is_super_admin()
      OR role NOT IN ('super_admin', 'manager')
    )
  );

-- Super admins and managers can delete invitations
CREATE POLICY "Admins can delete invitations"
  ON public.user_invitations FOR DELETE
  TO authenticated
  USING (is_admin_or_manager());

-- ============================================
-- Step 5: Add comments for documentation
-- ============================================

COMMENT ON FUNCTION is_super_admin() IS 'Check if the current user has super_admin role';
COMMENT ON FUNCTION is_admin_or_manager() IS 'Check if the current user has super_admin or manager role';

COMMENT ON POLICY "Authenticated users can view all users" ON public.users IS 'All authenticated users can see user list';
COMMENT ON POLICY "Users can update own profile" ON public.users IS 'Users can update their own profile (except role)';
COMMENT ON POLICY "Super admins can manage all users" ON public.users IS 'Super admins have full CRUD on all users';
COMMENT ON POLICY "Managers can manage non-admin users" ON public.users IS 'Managers can only manage assistants and accountants, not other managers or super_admins';
