-- ============================================
-- ENHANCED NOTIFICATIONS SYSTEM
-- ============================================

-- Add new columns to notifications table
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'system',
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_category ON public.notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Add comment
COMMENT ON COLUMN public.notifications.category IS 'Category: user, case, invoice, document, system';
COMMENT ON COLUMN public.notifications.action_url IS 'URL to navigate when notification is clicked';
COMMENT ON COLUMN public.notifications.actor_id IS 'User who triggered the notification';
COMMENT ON COLUMN public.notifications.metadata IS 'Additional data (case_id, invoice_id, etc.)';
