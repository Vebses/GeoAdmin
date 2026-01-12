-- ============================================
-- USER INVITATION AND PASSWORD RESET TOKENS
-- ============================================

-- Add invitation fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS invitation_token TEXT,
ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Add password reset fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;

-- Create indexes for token lookups
CREATE INDEX IF NOT EXISTS idx_users_invitation_token ON public.users(invitation_token) WHERE invitation_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON public.users(reset_token) WHERE reset_token IS NOT NULL;

-- Comments
COMMENT ON COLUMN public.users.invitation_token IS 'Hashed token for user invitation';
COMMENT ON COLUMN public.users.invitation_sent_at IS 'When the invitation was sent';
COMMENT ON COLUMN public.users.invitation_expires_at IS 'When the invitation expires';
COMMENT ON COLUMN public.users.invitation_accepted_at IS 'When the user accepted the invitation';
COMMENT ON COLUMN public.users.invited_by IS 'User who sent the invitation';
COMMENT ON COLUMN public.users.reset_token IS 'Hashed token for password reset';
COMMENT ON COLUMN public.users.reset_token_expires_at IS 'When the reset token expires';
