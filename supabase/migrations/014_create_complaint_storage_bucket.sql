-- =============================================
-- Migration: Create storage bucket for complaint attachments
-- REQ-62: Allow file attachments
-- =============================================

-- Note: This migration should be run in Supabase Dashboard
-- Storage buckets are created via Supabase Storage API or Dashboard

-- Create bucket for complaint attachments
-- Run this in Supabase SQL Editor or via Storage API

-- Example SQL (if using Supabase Storage API):
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--     'complaint-attachments',
--     'complaint-attachments',
--     false,
--     10485760, -- 10MB
--     ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
-- );

-- Or create via Supabase Dashboard:
-- 1. Go to Storage
-- 2. Create new bucket: "complaint-attachments"
-- 3. Set as private
-- 4. Set file size limit: 10MB
-- 5. Set allowed MIME types: image/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

-- Storage policies (Row Level Security)
-- Note: These policies check the users table for role-based access
CREATE POLICY "Complaint attachments are viewable by staff"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'complaint-attachments' 
        AND EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'admin', 'reviewer', 'manager')
        )
    );

CREATE POLICY "Complaint attachments are uploadable by staff"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'complaint-attachments' 
        AND EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'admin', 'reviewer', 'manager')
        )
    );

CREATE POLICY "Complaint attachments are deletable by admins"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'complaint-attachments' 
        AND EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'admin')
        )
    );

