// =============================================
// FILE: lib/supabase/storage.ts
// Optimized file storage operations
// =============================================

const BUCKET_NAME = 'assessment-photos';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
import { supabase } from '@/server/lib/supabase/client';

export interface UploadResult {
    path: string;
    url: string;
    error?: string;
}

export async function uploadFile(
    assessmentId: string,
    file: File
): Promise<UploadResult> {
    try {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return { path: '', url: '', error: 'File size exceeds 10MB limit' };
        }

        // Generate unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(7)}.${fileExt}`;
        const filePath = `${assessmentId}/${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            return { path: '', url: '', error: error.message };
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        return {
            path: data.path,
            url: urlData.publicUrl,
        };
    } catch (err) {
        return {
            path: '',
            url: '',
            error: err instanceof Error ? err.message : 'Upload failed',
        };
    }
}

export async function uploadMultipleFiles(
    assessmentId: string,
    files: File[]
): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
        const result = await uploadFile(assessmentId, files[i]);
        results.push(result);
    }

    return results;
}

export async function deleteFile(filePath: string): Promise<boolean> {
    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

    return !error;
}
