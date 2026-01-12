-- ============================================
-- USER INVITATIONS TABLE (separate from users)
-- ============================================

-- Create user_invitations table for pending invitations
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'assistant' CHECK (role IN ('manager', 'assistant', 'accountant')),
  invitation_token TEXT NOT NULL,
  invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON public.user_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON public.user_invitations(email);

-- Add password reset fields to users table (these are OK since user already exists)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;

-- Index for reset token lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON public.users(reset_token) WHERE reset_token IS NOT NULL;

-- Enable RLS
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_invitations
CREATE POLICY "Managers can view all invitations" ON public.user_invitations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'manager')
  );

CREATE POLICY "Managers can create invitations" ON public.user_invitations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'manager')
  );

CREATE POLICY "Managers can delete invitations" ON public.user_invitations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'manager')
  );

-- Comments
COMMENT ON TABLE public.user_invitations IS 'Pending user invitations';
COMMENT ON COLUMN public.user_invitations.invitation_token IS 'Hashed token for invitation verification';
COMMENT ON COLUMN public.user_invitations.expires_at IS 'When the invitation expires (48 hours from creation)';
