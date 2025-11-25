// =============================================
// FILE: app/api/assessments/[id]/files/route.ts
// POST: Upload files for assessment
// GET: List files for assessment
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { validateAndExtractIp } from '@/server/lib/utils/security';
import type { Database } from '@/server/lib/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

type UploadedFileInsert =
    Database['public']['Tables']['uploaded_files']['Insert'];
type UploadedFileRow = Database['public']['Tables']['uploaded_files']['Row'];
type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];

// Remove unused type warning by using it
export type { UploadedFileInsert };

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
] as const;

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
] as const;

const BUCKET_NAME = 'Assessment-photos';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_UPLOAD = 30;
const MAX_FILENAME_LENGTH = 255;

/**
 * Validates file extension against allowed list
 */
function isValidFileExtension(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (!ext) return false;
    return ALLOWED_EXTENSIONS.includes(
        `.${ext}` as (typeof ALLOWED_EXTENSIONS)[number]
    );
}

/**
 * Validates MIME type for images
 */
function isValidImageMimeType(mimeType: string): boolean {
    return ALLOWED_IMAGE_TYPES.includes(
        mimeType as (typeof ALLOWED_IMAGE_TYPES)[number]
    );
}

/**
 * Sanitizes filename to prevent path traversal and other attacks
 */
function sanitizeFilename(filename: string): string {
    // Remove path separators and dangerous characters
    return filename
        .replace(/[\/\\]/g, '')
        .replace(/\.\./g, '')
        .replace(/[<>:"|?*]/g, '')
        .trim()
        .substring(0, MAX_FILENAME_LENGTH);
}

/**
 * Logs audit event for file operations
 */
async function logAuditEvent(
    supabase: SupabaseClient<Database>,
    action: string,
    assessmentId: string,
    ipAddress: string | null,
    userAgent: string | null,
    metadata?: Record<string, unknown>
): Promise<void> {
    try {
        const auditLog: AuditLogInsert = {
            action,
            assessment_id: assessmentId,
            new_values: {
                assessmentId,
                ...metadata,
            },
            ip_address: ipAddress,
            user_agent: userAgent,
            changed_at: new Date().toISOString(),
        };

        await (
            supabase.from('audit_logs') as unknown as {
                insert: (values: AuditLogInsert) => Promise<unknown>;
            }
        ).insert(auditLog);
    } catch (error) {
        // Don't fail the request if audit logging fails
        console.error('[AUDIT] Failed to log event:', error);
    }
}

/**
 * Verifies assessment exists and is not deleted
 */
async function verifyAssessment(
    supabase: SupabaseClient<Database>,
    assessmentId: string
): Promise<{ id: string } | null> {
    const { data, error } = await supabase
        .from('assessments')
        .select('id')
        .eq('id', assessmentId)
        .is('deleted_at', null)
        .single();

    if (error || !data) {
        return null;
    }

    return data;
}

// POST: Upload files
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = createServerClient();
    const rawIpHeader = request.headers.get('x-forwarded-for');
    const ipAddress = validateAndExtractIp(rawIpHeader);
    const userAgent = request.headers.get('user-agent');

    try {
        const { id: assessmentId } = await params;

        // Validate assessment ID format (UUID)
        if (
            !assessmentId ||
            typeof assessmentId !== 'string' ||
            assessmentId.length < 10
        ) {
            return NextResponse.json(
                { error: 'Invalid assessment ID' },
                { status: 400 }
            );
        }

        // Verify assessment exists and is not deleted
        const assessment = await verifyAssessment(supabase, assessmentId);
        if (!assessment) {
            await logAuditEvent(
                supabase,
                'file_upload_failed',
                assessmentId,
                ipAddress,
                userAgent,
                { reason: 'assessment_not_found' }
            );
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
        if (files.length > MAX_FILES_PER_UPLOAD) {
            return NextResponse.json(
                {
                    error: `Maximum ${MAX_FILES_PER_UPLOAD} files allowed per upload`,
                },
                { status: 400 }
            );
        }

        const uploadResults: Array<{
            name: string;
            success: boolean;
            id?: string;
            url?: string;
            error?: string;
        }> = [];
        const uploadedFilePaths: string[] = []; // Track for rollback

        for (const file of files) {
            // Validate file name
            const sanitizedFileName = sanitizeFilename(file.name);
            if (!sanitizedFileName || sanitizedFileName.length === 0) {
                uploadResults.push({
                    name: file.name,
                    success: false,
                    error: 'Invalid file name',
                });
                continue;
            }

            // Validate file size
            if (file.size === 0) {
                uploadResults.push({
                    name: file.name,
                    success: false,
                    error: 'File is empty',
                });
                continue;
            }

            if (file.size > MAX_FILE_SIZE) {
                uploadResults.push({
                    name: file.name,
                    success: false,
                    error: `File size exceeds ${
                        MAX_FILE_SIZE / 1024 / 1024
                    }MB limit`,
                });
                continue;
            }

            // Validate file extension
            if (!isValidFileExtension(file.name)) {
                uploadResults.push({
                    name: file.name,
                    success: false,
                    error: `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(
                        ', '
                    )}`,
                });
                continue;
            }

            const fileExt = file.name.split('.').pop()?.toLowerCase() || '';

            // Validate MIME type for images
            if (file.type && file.type.startsWith('image/')) {
                if (!isValidImageMimeType(file.type)) {
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
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(2, 9);
            const fileName = `${timestamp}-${randomStr}.${fileExt}`;
            const filePath = `${assessmentId}/${fileName}`;

            // Upload to storage
            const { error: uploadError } = await supabase.storage
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

            // Track uploaded file for potential rollback
            uploadedFilePaths.push(filePath);

            // Get public URL for the uploaded file
            const {
                data: { publicUrl },
            } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

            // Save file record in database
            const fileInsert: UploadedFileInsert = {
                assessment_id: assessmentId,
                file_name: sanitizedFileName,
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
            };

            const { data: fileRecord, error: dbError } = await (
                supabase.from('uploaded_files') as unknown as {
                    insert: (values: UploadedFileInsert[]) => {
                        select: () => {
                            single: () => Promise<{
                                data: UploadedFileRow | null;
                                error: { message: string } | null;
                            }>;
                        };
                    };
                }
            )
                .insert([fileInsert])
                .select()
                .single();

            if (dbError || !fileRecord) {
                // Rollback: Delete uploaded file from storage if DB insert fails
                await supabase.storage.from(BUCKET_NAME).remove([filePath]);

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

        // Log audit event
        await logAuditEvent(
            supabase,
            'files_uploaded',
            assessmentId,
            ipAddress,
            userAgent,
            {
                filesCount: files.length,
                successCount,
                failCount,
            }
        );

        return NextResponse.json({
            success: true,
            uploaded: successCount,
            failed: failCount,
            results: uploadResults,
        });
    } catch (error) {
        console.error('[FILE_UPLOAD] Error:', error);

        // Log error to audit
        try {
            const { id: assessmentId } = await params;
            await logAuditEvent(
                supabase,
                'file_upload_error',
                assessmentId || 'unknown',
                ipAddress,
                userAgent,
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                }
            );
        } catch (auditError) {
            console.error('[AUDIT] Failed to log error:', auditError);
        }

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
    const supabase = createServerClient();
    const rawIpHeader = request.headers.get('x-forwarded-for');
    const ipAddress = validateAndExtractIp(rawIpHeader);
    const userAgent = request.headers.get('user-agent');

    try {
        const { id: assessmentId } = await params;

        // Validate assessment ID format
        if (
            !assessmentId ||
            typeof assessmentId !== 'string' ||
            assessmentId.length < 10
        ) {
            return NextResponse.json(
                { error: 'Invalid assessment ID' },
                { status: 400 }
            );
        }

        // Verify assessment exists and is not deleted
        const assessment = await verifyAssessment(supabase, assessmentId);
        if (!assessment) {
            return NextResponse.json(
                { error: 'Assessment not found' },
                { status: 404 }
            );
        }

        // Fetch files with proper error handling
        const { data, error } = await supabase
            .from('uploaded_files')
            .select('*')
            .eq('assessment_id', assessmentId)
            .order('uploaded_at', { ascending: false });

        if (error) {
            console.error('[FILE_LIST] Database error:', error);
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

        // Log audit event for file listing
        await logAuditEvent(
            supabase,
            'files_listed',
            assessmentId,
            ipAddress,
            userAgent,
            { filesCount: enhancedData.length }
        );

        return NextResponse.json({ data: enhancedData });
    } catch (error) {
        console.error('[FILE_LIST] Error:', error);
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
