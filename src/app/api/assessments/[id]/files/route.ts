// =============================================
// FILE: app/api/assessments/[id]/files/route.ts
// POST: Upload files for assessment
// GET: List files for assessment
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import type { Database } from '@/server/lib/types/database.types';

type UploadedFileInsert =
    Database['public']['Tables']['uploaded_files']['Insert'];
type UploadedFileRow = Database['public']['Tables']['uploaded_files']['Row'];

export const runtime = 'nodejs';

// Allowed image MIME types
const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.bmp',
    '.svg',
    '.pdf',
    '.doc',
    '.docx',
];

const BUCKET_NAME = 'assessment-photos';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// POST: Upload files
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createServerClient();
        const { id: assessmentId } = await params;

        // Verify assessment exists
        const { data: assessment } = await (supabase.from('assessments') as any)
            .select('id')
            .eq('id', assessmentId)
            .is('deleted_at', null)
            .single();

        if (!assessment) {
            return NextResponse.json(
                { error: 'Assessment not found' },
                { status: 404 }
            );
        }

        // Get form data
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: 'No files provided' },
                { status: 400 }
            );
        }

        // Validate file count
        if (files.length > 30) {
            return NextResponse.json(
                { error: 'Maximum 30 files allowed' },
                { status: 400 }
            );
        }

        const uploadResults = [];

        for (const file of files) {
            // Validate file size
            if (file.size > MAX_FILE_SIZE) {
                uploadResults.push({
                    name: file.name,
                    success: false,
                    error: 'File size exceeds 10MB limit',
                });
                continue;
            }

            // Validate file extension
            const fileExt = file.name.split('.').pop()?.toLowerCase();
            if (!fileExt || !ALLOWED_EXTENSIONS.includes(`.${fileExt}`)) {
                uploadResults.push({
                    name: file.name,
                    success: false,
                    error: `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(
                        ', '
                    )}`,
                });
                continue;
            }

            // Validate MIME type for images
            if (file.type && file.type.startsWith('image/')) {
                if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                    uploadResults.push({
                        name: file.name,
                        success: false,
                        error: `Image type not allowed. Allowed types: ${ALLOWED_IMAGE_TYPES.join(
                            ', '
                        )}`,
                    });
                    continue;
                }
            }

            // Generate unique file path
            const fileName = `${Date.now()}-${Math.random()
                .toString(36)
                .substring(7)}.${fileExt}`;
            const filePath = `${assessmentId}/${fileName}`;

            // Upload to storage
            const { data: uploadData, error: uploadError } =
                await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false,
                    });

            if (uploadError) {
                uploadResults.push({
                    name: file.name,
                    success: false,
                    error: uploadError.message,
                });
                continue;
            }

            // Get public URL for the uploaded file
            const {
                data: { publicUrl },
            } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

            // Save file record in database
            // Type assertion needed due to TypeScript inference issue with Supabase client
            const { data, error: dbError } = await supabase
                .from('uploaded_files')
                .insert([
                    {
                        assessment_id: assessmentId,
                        file_name: file.name,
                        file_url: publicUrl,
                        file_type: file.type || `application/${fileExt}`,
                        file_size: file.size,
                        storage_path: filePath,
                        processing_status: 'uploaded',
                        metadata: {
                            isImage: file.type?.startsWith('image/') || false,
                            originalName: file.name,
                            uploadedAt: new Date().toISOString(),
                        },
                    },
                ] as any)
                .select()
                .single();

            const fileRecord = data as UploadedFileRow | null;

            if (dbError || !fileRecord) {
                uploadResults.push({
                    name: file.name,
                    success: false,
                    error: dbError?.message || 'Failed to save file record',
                });
                continue;
            }

            uploadResults.push({
                name: file.name,
                success: true,
                id: fileRecord.id,
                url: publicUrl,
            });
        }

        const successCount = uploadResults.filter(r => r.success).length;
        const failCount = uploadResults.filter(r => !r.success).length;

        return NextResponse.json({
            success: true,
            uploaded: successCount,
            failed: failCount,
            results: uploadResults,
        });
    } catch (error) {
        console.error('File upload error:', error);
        return NextResponse.json(
            {
                error: 'File upload failed',
                message:
                    error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// GET: List files
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createServerClient();
        const { id: assessmentId } = await params;

        // Verify assessment exists
        const { data: assessment } = await (supabase.from('assessments') as any)
            .select('id')
            .eq('id', assessmentId)
            .is('deleted_at', null)
            .single();

        if (!assessment) {
            return NextResponse.json(
                { error: 'Assessment not found' },
                { status: 404 }
            );
        }

        const { data, error } = await supabase
            .from('uploaded_files')
            .select('*')
            .eq('assessment_id', assessmentId)
            .order('uploaded_at', { ascending: false });

        if (error) {
            return NextResponse.json(
                { error: 'Failed to fetch files', details: error.message },
                { status: 500 }
            );
        }

        // Enhance file data with image information
        const enhancedData = (data || []).map((file: UploadedFileRow) => {
            const isImage = file.file_type?.startsWith('image/') || false;

            return {
                ...file,
                isImage,
                // Use original URL as thumbnail (frontend can handle resizing if needed)
                thumbnailUrl: isImage ? file.file_url : null,
            };
        });

        return NextResponse.json({ data: enhancedData });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details:
                    error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
