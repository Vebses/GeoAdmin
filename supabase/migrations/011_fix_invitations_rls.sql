-- ============================================
-- FIX USER INVITATIONS RLS POLICIES
-- ============================================
-- Issues:
-- 1. Missing UPDATE policy (so accepted_at can't be set)
-- 2. Policies only check for 'manager', not 'super_admin'

-- Drop existing policies (both old "Managers" and new "Admins" names)
DROP POLICY IF EXISTS "Managers can view all invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Managers can create invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Managers can delete invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Admins can view all invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Anyone can mark invitation as accepted" ON public.user_invitations;

-- Create updated policies that include super_admin
CREATE POLICY "Admins can view all invitations" ON public.user_invitations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'manager'))
  );

CREATE POLICY "Admins can create invitations" ON public.user_invitations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'manager'))
  );

CREATE POLICY "Admins can delete invitations" ON public.user_invitations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'manager'))
  );

-- Add UPDATE policy for admins
-- Note: The accept-invite API uses the admin client (service role key) to bypass RLS
-- when marking invitations as accepted, so we only need this policy for manual updates
CREATE POLICY "Admins can update invitations" ON public.user_invitations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'manager'))
  );

-- Update role constraint to include super_admin
ALTER TABLE public.user_invitations
  DROP CONSTRAINT IF EXISTS user_invitations_role_check;

ALTER TABLE public.user_invitations
  ADD CONSTRAINT user_invitations_role_check
  CHECK (role IN ('super_admin', 'manager', 'assistant', 'accountant'));

-- Comments
COMMENT ON POLICY "Admins can view all invitations" ON public.user_invitations IS 'Super admins and managers can view all pending invitations';
COMMENT ON POLICY "Admins can create invitations" ON public.user_invitations IS 'Super admins and managers can create new invitations';
COMMENT ON POLICY "Admins can delete invitations" ON public.user_invitations IS 'Super admins and managers can cancel invitations';
COMMENT ON POLICY "Admins can update invitations" ON public.user_invitations IS 'Super admins and managers can update invitations';
