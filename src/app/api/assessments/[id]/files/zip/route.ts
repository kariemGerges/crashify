// =============================================
// FILE: app/api/assessments/[id]/files/zip/route.ts
// GET: Download all photos as ZIP file
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { validateAndExtractIp } from '@/server/lib/utils/security';
import type { Database } from '@/server/lib/types/database.types';
import JSZip from 'jszip';

type UploadedFileRow = Database['public']['Tables']['uploaded_files']['Row'];

const BUCKET_NAME = 'Assessment-photos';

export const runtime = 'nodejs';

// GET: Download all photos as ZIP
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

        // Validate assessment ID
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

        // Verify assessment exists
        const { data: assessment, error: assessmentError } = await supabase
            .from('assessments')
            .select('id, company_name, make, model, registration')
            .eq('id', assessmentId)
            .is('deleted_at', null)
            .single();

        if (assessmentError || !assessment) {
            return NextResponse.json(
                { error: 'Assessment not found' },
                { status: 404 }
            );
        }

        // Fetch all image files
        const { data: files, error: filesError } = await supabase
            .from('uploaded_files')
            .select('*')
            .eq('assessment_id', assessmentId)
            .like('file_type', 'image/%')
            .order('uploaded_at', { ascending: true });

        if (filesError) {
            console.error('[ZIP_DOWNLOAD] Database error:', filesError);
            return NextResponse.json(
                { error: 'Failed to fetch files', details: filesError.message },
                { status: 500 }
            );
        }

        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: 'No photos found for this assessment' },
                { status: 404 }
            );
        }

        // Create ZIP file
        const zip = new JSZip();

        // Download and add each image to ZIP
        for (let i = 0; i < files.length; i++) {
            const file = files[i] as UploadedFileRow;
            
            try {
                // Download file from Supabase Storage
                const { data: fileData, error: downloadError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .download(file.storage_path);

                if (downloadError || !fileData) {
                    console.error(`[ZIP_DOWNLOAD] Failed to download file ${file.file_name}:`, downloadError);
                    continue; // Skip this file but continue with others
                }

                // Convert blob to array buffer
                const arrayBuffer = await fileData.arrayBuffer();
                
                // Generate filename with zero-padded index
                const index = String(i + 1).padStart(3, '0');
                const fileExt = file.file_name.split('.').pop() || 'jpg';
                const zipFileName = `IMG_${index}.${fileExt}`;

                // Add to ZIP
                zip.file(zipFileName, arrayBuffer);
            } catch (err) {
                console.error(`[ZIP_DOWNLOAD] Error processing file ${file.file_name}:`, err);
                continue; // Skip this file but continue with others
            }
        }

        // Generate ZIP file
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const zipBuffer = await zipBlob.arrayBuffer();

        // Log audit event
        try {
            const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] = {
                action: 'photos_zip_downloaded',
                old_values: {},
                new_values: {
                    assessment_id: assessmentId,
                    file_count: files.length,
                },
                ip_address: ipAddress || undefined,
                user_agent: userAgent || undefined,
                changed_at: new Date().toISOString(),
            };
            await (supabase.from('audit_logs') as unknown as {
                insert: (values: Database['public']['Tables']['audit_logs']['Insert'][]) => Promise<unknown>;
            }).insert([auditLogInsert]);
        } catch (auditError) {
            console.error('[ZIP_DOWNLOAD] Audit log failed:', auditError);
            // Don't fail the request if audit logging fails
        }

        // Return ZIP file
        return new NextResponse(zipBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="CarDamage_${assessmentId}.zip"`,
                'Content-Length': zipBuffer.byteLength.toString(),
            },
        });
    } catch (error) {
        console.error('[ZIP_DOWNLOAD] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate ZIP file',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

