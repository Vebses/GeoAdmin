-- ============================================
-- FIX: Document Upload & Storage
-- ============================================
-- Problem: Document upload returns 500 because:
-- 1. RLS policies may be blocking inserts on case_documents
-- 2. Storage bucket may not exist or have correct policies
-- ============================================

-- 1. Fix RLS on case_documents table
DROP POLICY IF EXISTS "Anyone can view case_documents" ON public.case_documents;
DROP POLICY IF EXISTS "Anyone can manage case_documents" ON public.case_documents;

CREATE POLICY "Anyone can view case_documents" ON public.case_documents 
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "Anyone can manage case_documents" ON public.case_documents 
    FOR ALL TO authenticated 
    USING (true)
    WITH CHECK (true);

-- 2. Create storage bucket (if not exists)
-- Run this in SQL editor - it creates the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('geoadmin-files', 'geoadmin-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Storage policies for the bucket
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update access" ON storage.objects;

-- Allow public read (for viewing uploaded files)
CREATE POLICY "Public read access" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'geoadmin-files');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload access" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'geoadmin-files');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated delete access" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'geoadmin-files');

-- Allow authenticated users to update
CREATE POLICY "Authenticated update access" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'geoadmin-files')
    WITH CHECK (bucket_id = 'geoadmin-files');
