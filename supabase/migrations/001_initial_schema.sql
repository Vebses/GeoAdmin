-- ============================================
-- GEOADMIN DATABASE SCHEMA - COMPLETE
-- Version: 2.0
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('manager', 'assistant', 'accountant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE case_status AS ENUM ('draft', 'in_progress', 'paused', 'delayed', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('draft', 'unpaid', 'paid', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE currency_code AS ENUM ('GEL', 'USD', 'EUR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_type AS ENUM ('patient', 'original', 'medical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_language AS ENUM ('en', 'ka');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error', 'case_assigned', 'invoice_paid', 'invoice_failed', 'case_updated', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- USERS (extends Supabase auth.users)
-- ============================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'assistant',
    is_active BOOLEAN NOT NULL DEFAULT true,
    avatar_url TEXT,
    phone TEXT,
    preferences JSONB DEFAULT '{
        "theme": "light",
        "language": "ka",
        "date_format": "DD/MM/YYYY",
        "time_format": "24h",
        "notifications": {
            "email_case_assigned": true,
            "email_invoice_paid": true,
            "push_enabled": true,
            "sound_enabled": true
        },
        "default_company_id": null
    }'::jsonb,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_search ON public.users USING gin(
    to_tsvector('simple', coalesce(full_name, '') || ' ' || coalesce(email, ''))
);

-- ============================================
-- CATEGORIES
-- ============================================

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    name_en TEXT,
    description TEXT,
    color TEXT DEFAULT '#6366f1',
    icon TEXT DEFAULT 'folder',
    is_system BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PARTNERS
-- ============================================

CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    legal_name TEXT,
    id_code TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    country TEXT DEFAULT 'საქართველო',
    city TEXT,
    address TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    notes TEXT,
    cases_count INTEGER DEFAULT 0,
    invoices_count INTEGER DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_partners_category ON public.partners(category_id);
CREATE INDEX IF NOT EXISTS idx_partners_deleted ON public.partners(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_partners_search ON public.partners USING gin(
    to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(legal_name, '') || ' ' || coalesce(id_code, ''))
);

-- ============================================
-- OUR COMPANIES
-- ============================================

CREATE TABLE IF NOT EXISTS public.our_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    legal_name TEXT NOT NULL,
    id_code TEXT NOT NULL,
    country TEXT DEFAULT 'საქართველო',
    city TEXT,
    address TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    bank_name TEXT,
    bank_code TEXT,
    account_gel TEXT,
    account_usd TEXT,
    account_eur TEXT,
    logo_url TEXT,
    signature_url TEXT,
    stamp_url TEXT,
    invoice_prefix TEXT DEFAULT 'INV',
    invoice_footer_text TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_our_companies_default ON public.our_companies(is_default) WHERE is_default = true AND deleted_at IS NULL;

-- ============================================
-- CASES
-- ============================================

CREATE TABLE IF NOT EXISTS public.cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number TEXT NOT NULL UNIQUE,
    status case_status NOT NULL DEFAULT 'draft',
    patient_name TEXT NOT NULL,
    patient_id TEXT,
    patient_dob DATE,
    patient_phone TEXT,
    patient_email TEXT,
    insurance_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
    insurance_policy_number TEXT,
    client_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_medical BOOLEAN NOT NULL DEFAULT true,
    is_documented BOOLEAN NOT NULL DEFAULT false,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    complaints TEXT,
    needs TEXT,
    diagnosis TEXT,
    treatment_notes TEXT,
    opened_at DATE NOT NULL DEFAULT CURRENT_DATE,
    closed_at DATE,
    total_service_cost DECIMAL(12,2) DEFAULT 0,
    total_assistance_cost DECIMAL(12,2) DEFAULT 0,
    total_commission_cost DECIMAL(12,2) DEFAULT 0,
    actions_count INTEGER DEFAULT 0,
    documents_count INTEGER DEFAULT 0,
    invoices_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_assigned ON public.cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_cases_client ON public.cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_number ON public.cases(case_number);
CREATE INDEX IF NOT EXISTS idx_cases_deleted ON public.cases(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cases_opened ON public.cases(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_search ON public.cases USING gin(
    to_tsvector('simple', coalesce(case_number, '') || ' ' || coalesce(patient_name, '') || ' ' || coalesce(patient_id, ''))
);

-- ============================================
-- CASE ACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.case_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    executor_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
    service_name TEXT NOT NULL,
    service_description TEXT,
    service_cost DECIMAL(10,2) DEFAULT 0,
    service_currency currency_code DEFAULT 'GEL',
    assistance_cost DECIMAL(10,2) DEFAULT 0,
    assistance_currency currency_code DEFAULT 'GEL',
    commission_cost DECIMAL(10,2) DEFAULT 0,
    commission_currency currency_code DEFAULT 'GEL',
    service_date DATE,
    comment TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_actions_case ON public.case_actions(case_id);
CREATE INDEX IF NOT EXISTS idx_case_actions_executor ON public.case_actions(executor_id);

-- ============================================
-- CASE DOCUMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.case_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    type document_type NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    thumbnail_url TEXT,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_documents_case ON public.case_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_case_documents_type ON public.case_documents(case_id, type);

-- ============================================
-- INVOICES
-- ============================================

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT NOT NULL UNIQUE,
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE RESTRICT,
    sender_id UUID NOT NULL REFERENCES public.our_companies(id) ON DELETE RESTRICT,
    status invoice_status NOT NULL DEFAULT 'draft',
    currency currency_code NOT NULL DEFAULT 'EUR',
    subtotal DECIMAL(12,2) DEFAULT 0,
    franchise DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    language invoice_language NOT NULL DEFAULT 'en',
    email_subject TEXT,
    email_body TEXT,
    recipient_email TEXT,
    cc_emails TEXT[],
    attach_patient_docs BOOLEAN DEFAULT false,
    attach_original_docs BOOLEAN DEFAULT false,
    attach_medical_docs BOOLEAN DEFAULT false,
    paid_at TIMESTAMPTZ,
    paid_amount DECIMAL(12,2),
    payment_reference TEXT,
    payment_notes TEXT,
    pdf_url TEXT,
    pdf_generated_at TIMESTAMPTZ,
    notes TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invoices_case ON public.invoices(case_id);
CREATE INDEX IF NOT EXISTS idx_invoices_recipient ON public.invoices(recipient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_sender ON public.invoices(sender_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_deleted ON public.invoices(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_created ON public.invoices(created_at DESC);

-- ============================================
-- INVOICE SERVICES
-- ============================================

CREATE TABLE IF NOT EXISTS public.invoice_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    is_auto BOOLEAN DEFAULT false,
    source_action_id UUID REFERENCES public.case_actions(id) ON DELETE SET NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_services_invoice ON public.invoice_services(invoice_id);

-- ============================================
-- INVOICE SEND HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS public.invoice_sends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    cc_emails TEXT[],
    subject TEXT NOT NULL,
    body TEXT,
    is_resend BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    error_message TEXT,
    resend_id TEXT,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invoice_sends_invoice ON public.invoice_sends(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_sends_status ON public.invoice_sends(status);

-- ============================================
-- ACTIVITY LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_name TEXT,
    action TEXT NOT NULL CHECK (action IN (
        'created', 'updated', 'deleted', 'restored', 
        'sent', 'paid', 'cancelled', 'assigned',
        'uploaded', 'downloaded', 'exported',
        'login', 'logout', 'password_changed'
    )),
    entity_type TEXT NOT NULL CHECK (entity_type IN (
        'case', 'invoice', 'partner', 'category', 
        'our_company', 'user', 'document', 'settings'
    )),
    entity_id UUID,
    entity_name TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);

-- ============================================
-- SETTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    value JSONB,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT,
    link TEXT,
    metadata JSONB,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- ============================================
-- USER SESSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
DROP TRIGGER IF EXISTS update_partners_updated_at ON public.partners;
DROP TRIGGER IF EXISTS update_our_companies_updated_at ON public.our_companies;
DROP TRIGGER IF EXISTS update_cases_updated_at ON public.cases;
DROP TRIGGER IF EXISTS update_case_actions_updated_at ON public.case_actions;
DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_our_companies_updated_at BEFORE UPDATE ON public.our_companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_case_actions_updated_at BEFORE UPDATE ON public.case_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Generate case number
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    year TEXT;
    seq INTEGER;
    new_number TEXT;
BEGIN
    SELECT COALESCE(REPLACE(value::TEXT, '"', ''), 'GEO') INTO prefix 
    FROM public.settings WHERE key = 'case_number_prefix';
    
    prefix := COALESCE(prefix, 'GEO');
    year := TO_CHAR(NOW(), 'YYYY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(case_number FROM LENGTH(prefix) + 7 FOR 4) AS INTEGER)), 0) + 1 INTO seq
    FROM public.cases
    WHERE case_number LIKE prefix || '-' || year || '-%';
    
    new_number := prefix || '-' || year || '-' || LPAD(seq::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(company_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    year_month TEXT;
    seq INTEGER;
    new_number TEXT;
BEGIN
    IF company_id IS NOT NULL THEN
        SELECT COALESCE(invoice_prefix, 'INV') INTO prefix 
        FROM public.our_companies WHERE id = company_id;
    END IF;
    
    IF prefix IS NULL THEN
        SELECT COALESCE(REPLACE(value::TEXT, '"', ''), 'INV') INTO prefix 
        FROM public.settings WHERE key = 'invoice_number_prefix';
    END IF;
    
    prefix := COALESCE(prefix, 'INV');
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM LENGTH(prefix) + 8 FOR 4) AS INTEGER)), 0) + 1 INTO seq
    FROM public.invoices
    WHERE invoice_number LIKE prefix || '-' || year_month || '-%';
    
    new_number := prefix || '-' || year_month || '-' || LPAD(seq::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Update case totals
CREATE OR REPLACE FUNCTION update_case_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.cases SET
        total_service_cost = (
            SELECT COALESCE(SUM(service_cost), 0) 
            FROM public.case_actions WHERE case_id = COALESCE(NEW.case_id, OLD.case_id)
        ),
        total_assistance_cost = (
            SELECT COALESCE(SUM(assistance_cost), 0) 
            FROM public.case_actions WHERE case_id = COALESCE(NEW.case_id, OLD.case_id)
        ),
        total_commission_cost = (
            SELECT COALESCE(SUM(commission_cost), 0) 
            FROM public.case_actions WHERE case_id = COALESCE(NEW.case_id, OLD.case_id)
        ),
        actions_count = (
            SELECT COUNT(*) 
            FROM public.case_actions WHERE case_id = COALESCE(NEW.case_id, OLD.case_id)
        )
    WHERE id = COALESCE(NEW.case_id, OLD.case_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_case_totals_on_action ON public.case_actions;
CREATE TRIGGER update_case_totals_on_action
AFTER INSERT OR UPDATE OR DELETE ON public.case_actions
FOR EACH ROW EXECUTE FUNCTION update_case_totals();

-- Update case document count
CREATE OR REPLACE FUNCTION update_case_document_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.cases SET
        documents_count = (
            SELECT COUNT(*) 
            FROM public.case_documents WHERE case_id = COALESCE(NEW.case_id, OLD.case_id)
        )
    WHERE id = COALESCE(NEW.case_id, OLD.case_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_case_documents_count ON public.case_documents;
CREATE TRIGGER update_case_documents_count
AFTER INSERT OR DELETE ON public.case_documents
FOR EACH ROW EXECUTE FUNCTION update_case_document_count();

-- Update invoice total
CREATE OR REPLACE FUNCTION update_invoice_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.invoices SET
        subtotal = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM public.invoice_services WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
        ),
        total = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM public.invoice_services WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
        ) - COALESCE(franchise, 0)
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_invoice_total_on_service ON public.invoice_services;
CREATE TRIGGER update_invoice_total_on_service
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_services
FOR EACH ROW EXECUTE FUNCTION update_invoice_total();

-- Handle new user registration (create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'assistant'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.our_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Managers can manage users" ON public.users;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Managers can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view active partners" ON public.partners;
DROP POLICY IF EXISTS "Anyone can manage partners" ON public.partners;
DROP POLICY IF EXISTS "Anyone can view active companies" ON public.our_companies;
DROP POLICY IF EXISTS "Managers can manage companies" ON public.our_companies;
DROP POLICY IF EXISTS "Anyone can view active cases" ON public.cases;
DROP POLICY IF EXISTS "Anyone can manage cases" ON public.cases;
DROP POLICY IF EXISTS "Anyone can view case_actions" ON public.case_actions;
DROP POLICY IF EXISTS "Anyone can manage case_actions" ON public.case_actions;
DROP POLICY IF EXISTS "Anyone can view case_documents" ON public.case_documents;
DROP POLICY IF EXISTS "Anyone can manage case_documents" ON public.case_documents;
DROP POLICY IF EXISTS "Anyone can view active invoices" ON public.invoices;
DROP POLICY IF EXISTS "Anyone can manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Anyone can view invoice_services" ON public.invoice_services;
DROP POLICY IF EXISTS "Anyone can manage invoice_services" ON public.invoice_services;
DROP POLICY IF EXISTS "Anyone can view invoice_sends" ON public.invoice_sends;
DROP POLICY IF EXISTS "Anyone can create invoice_sends" ON public.invoice_sends;
DROP POLICY IF EXISTS "Anyone can view activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "System can insert activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Managers can view settings" ON public.settings;
DROP POLICY IF EXISTS "Managers can update settings" ON public.settings;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can manage own sessions" ON public.user_sessions;

-- RLS POLICIES

-- Users
CREATE POLICY "Users can view all users" ON public.users 
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.users 
    FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Managers can manage users" ON public.users 
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'manager')
    );

-- Categories
CREATE POLICY "Anyone can view categories" ON public.categories 
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can manage categories" ON public.categories 
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'manager')
    );

-- Partners
CREATE POLICY "Anyone can view active partners" ON public.partners 
    FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "Anyone can manage partners" ON public.partners 
    FOR ALL TO authenticated USING (true);

-- Our Companies
CREATE POLICY "Anyone can view active companies" ON public.our_companies 
    FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "Managers can manage companies" ON public.our_companies 
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'manager')
    );

-- Cases
CREATE POLICY "Anyone can view active cases" ON public.cases 
    FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "Anyone can manage cases" ON public.cases 
    FOR ALL TO authenticated USING (true);

-- Case Actions
CREATE POLICY "Anyone can view case_actions" ON public.case_actions 
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can manage case_actions" ON public.case_actions 
    FOR ALL TO authenticated USING (true);

-- Case Documents
CREATE POLICY "Anyone can view case_documents" ON public.case_documents 
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can manage case_documents" ON public.case_documents 
    FOR ALL TO authenticated USING (true);

-- Invoices
CREATE POLICY "Anyone can view active invoices" ON public.invoices 
    FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "Anyone can manage invoices" ON public.invoices 
    FOR ALL TO authenticated USING (true);

-- Invoice Services
CREATE POLICY "Anyone can view invoice_services" ON public.invoice_services 
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can manage invoice_services" ON public.invoice_services 
    FOR ALL TO authenticated USING (true);

-- Invoice Sends
CREATE POLICY "Anyone can view invoice_sends" ON public.invoice_sends 
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can create invoice_sends" ON public.invoice_sends 
    FOR INSERT TO authenticated WITH CHECK (true);

-- Activity Logs
CREATE POLICY "Anyone can view activity_logs" ON public.activity_logs 
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert activity_logs" ON public.activity_logs 
    FOR INSERT TO authenticated WITH CHECK (true);

-- Settings
CREATE POLICY "Managers can view settings" ON public.settings 
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'manager')
    );
CREATE POLICY "Managers can update settings" ON public.settings 
    FOR UPDATE TO authenticated USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'manager')
    );

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications 
    FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications 
    FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON public.notifications 
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete own notifications" ON public.notifications 
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- User Sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions 
    FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage own sessions" ON public.user_sessions 
    FOR ALL TO authenticated USING (user_id = auth.uid());

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cases;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
