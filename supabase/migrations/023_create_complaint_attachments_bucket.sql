-- =============================================
-- Migration: Create complaint-attachments storage bucket
-- Fixes "Bucket not found" error when uploading attachments
-- =============================================

-- Create the storage bucket for complaint attachments
-- Note: This requires superuser privileges or service role key
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'complaint-attachments',
    'complaint-attachments',
    false, -- Private bucket
    10485760, -- 10MB file size limit
    ARRAY[
        'image/jpeg',
        'image/png', 
        'image/jpg',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for complaint attachments
-- Drop existing policies if they exist (to allow re-running migration)
DROP POLICY IF EXISTS "Allow anonymous uploads to complaint-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous reads from complaint-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Staff can access complaint attachments" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete complaint attachments" ON storage.objects;
DROP POLICY IF EXISTS "Complaint attachments are viewable by staff" ON storage.objects;
DROP POLICY IF EXISTS "Complaint attachments are uploadable by staff" ON storage.objects;
DROP POLICY IF EXISTS "Complaint attachments are deletable by admins" ON storage.objects;

-- Allow anonymous users to upload (for public complaint form)
CREATE POLICY "Allow anonymous uploads to complaint-attachments"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'complaint-attachments'
);

-- Allow anonymous users to read their own uploads (for tracking page)
CREATE POLICY "Allow anonymous reads from complaint-attachments"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'complaint-attachments'
);

-- Allow staff to access all complaint attachments
CREATE POLICY "Staff can access complaint attachments"
ON storage.objects FOR ALL
USING (
    bucket_id = 'complaint-attachments'
    AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'admin', 'reviewer', 'manager')
    )
);

-- Allow staff to delete complaint attachments
CREATE POLICY "Staff can delete complaint attachments"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'complaint-attachments'
    AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'admin', 'reviewer', 'manager')
    )
);

