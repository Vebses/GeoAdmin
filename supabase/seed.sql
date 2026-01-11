-- ============================================
-- GEOADMIN SEED DATA
-- Run this after the initial schema
-- ============================================

-- Seed system categories (skip if already exist)
INSERT INTO public.categories (name, name_en, is_system, color, icon, sort_order)
SELECT 'სადაზღვევო კომპანია', 'Insurance Company', true, '#3b82f6', 'shield', 1
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'სადაზღვევო კომპანია');

INSERT INTO public.categories (name, name_en, is_system, color, icon, sort_order)
SELECT 'ასისტანსი', 'Assistance', true, '#10b981', 'phone-call', 2
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'ასისტანსი');

INSERT INTO public.categories (name, name_en, is_system, color, icon, sort_order)
SELECT 'კლინიკა', 'Clinic', true, '#f59e0b', 'building-2', 3
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'კლინიკა');

-- Seed default settings
INSERT INTO public.settings (key, value, description)
SELECT 'invoice_number_prefix', '"INV"', 'Default prefix for invoice numbers'
WHERE NOT EXISTS (SELECT 1 FROM public.settings WHERE key = 'invoice_number_prefix');

INSERT INTO public.settings (key, value, description)
SELECT 'case_number_prefix', '"GEO"', 'Default prefix for case numbers'
WHERE NOT EXISTS (SELECT 1 FROM public.settings WHERE key = 'case_number_prefix');

INSERT INTO public.settings (key, value, description)
SELECT 'default_currency', '"EUR"', 'Default currency for new invoices'
WHERE NOT EXISTS (SELECT 1 FROM public.settings WHERE key = 'default_currency');

INSERT INTO public.settings (key, value, description)
SELECT 'default_invoice_language', '"en"', 'Default language for invoices'
WHERE NOT EXISTS (SELECT 1 FROM public.settings WHERE key = 'default_invoice_language');

INSERT INTO public.settings (key, value, description)
SELECT 'trash_retention_days', '30', 'Days to keep deleted items before permanent removal'
WHERE NOT EXISTS (SELECT 1 FROM public.settings WHERE key = 'trash_retention_days');

INSERT INTO public.settings (key, value, description)
SELECT 'session_timeout_minutes', '480', 'Session timeout in minutes (8 hours)'
WHERE NOT EXISTS (SELECT 1 FROM public.settings WHERE key = 'session_timeout_minutes');

INSERT INTO public.settings (key, value, description)
SELECT 'max_file_size_mb', '10', 'Maximum file upload size in MB'
WHERE NOT EXISTS (SELECT 1 FROM public.settings WHERE key = 'max_file_size_mb');

INSERT INTO public.settings (key, value, description)
SELECT 'allowed_file_types', '["pdf", "jpg", "jpeg", "png", "doc", "docx", "xls", "xlsx"]', 'Allowed file extensions'
WHERE NOT EXISTS (SELECT 1 FROM public.settings WHERE key = 'allowed_file_types');

INSERT INTO public.settings (key, value, description)
SELECT 'email_templates', '{
    "invoice_en": {
        "subject": "Invoice #{invoiceNumber} for Case #{caseNumber}",
        "body": "Dear Partner,\n\nPlease find attached the invoice #{invoiceNumber} for case #{caseNumber}.\n\nPatient: {patientName}\nAmount: {total} {currency}\n\nBest regards,\n{companyName}"
    },
    "invoice_ka": {
        "subject": "ინვოისი #{invoiceNumber} ქეისის #{caseNumber} თაობაზე",
        "body": "პატივცემულო პარტნიორო,\n\nგიგზავნით ინვოისს #{invoiceNumber} ქეისის #{caseNumber} თაობაზე.\n\nპაციენტი: {patientName}\nთანხა: {total} {currency}\n\nპატივისცემით,\n{companyName}"
    }
}'::jsonb, 'Email templates for invoices'
WHERE NOT EXISTS (SELECT 1 FROM public.settings WHERE key = 'email_templates');

-- Sample data for development (optional)
-- Uncomment the following sections if you want sample data

/*
-- Sample Our Company
INSERT INTO public.our_companies (name, legal_name, id_code, city, address, email, phone, bank_name, bank_code, account_gel, account_usd, account_eur, is_default)
VALUES (
    'GeoAssist',
    'GeoAssist LLC',
    '405123456',
    'თბილისი',
    'რუსთაველის გამზ. 24',
    'info@geoassist.ge',
    '+995 32 123 4567',
    'თიბისი ბანკი',
    'TBCBGE22',
    'GE29TB7894545064500001',
    'GE29TB7894545064500002',
    'GE29TB7894545064500003',
    true
);

-- Sample Partners
INSERT INTO public.partners (name, legal_name, id_code, category_id, city, email, phone)
SELECT 
    'Allianz Partners',
    'Allianz Partners Georgia LLC',
    '405111222',
    c.id,
    'თბილისი',
    'contact@allianz.ge',
    '+995 32 123 4567'
FROM public.categories c WHERE c.name = 'ასისტანსი';

INSERT INTO public.partners (name, legal_name, id_code, category_id, city, email, phone)
SELECT 
    'ევექსი',
    'შპს ევექსი ჰოსპიტალები',
    '405222333',
    c.id,
    'თბილისი',
    'info@evex.ge',
    '+995 32 255 0000'
FROM public.categories c WHERE c.name = 'კლინიკა';

INSERT INTO public.partners (name, legal_name, id_code, category_id, city, email, phone)
SELECT 
    'ალდაგი',
    'სს სადაზღვევო კომპანია ალდაგი',
    '405333444',
    c.id,
    'თბილისი',
    'info@aldagi.ge',
    '+995 32 244 4444'
FROM public.categories c WHERE c.name = 'სადაზღვევო კომპანია';
*/
