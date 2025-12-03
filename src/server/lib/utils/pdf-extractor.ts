// =============================================
// FILE: lib/utils/pdf-extractor.ts
// PDF Text Extraction Utility
// =============================================

import { createServerClient } from '@/server/lib/supabase/client';

/**
 * Extract text content from a PDF file stored in Supabase Storage
 */
export async function extractPDFText(storagePath: string): Promise<string> {
    try {
        const serverClient = createServerClient();

        // Download PDF from storage
        const { data: pdfData, error: downloadError } =
            await serverClient.storage
                .from('Assessment-photos')
                .download(storagePath);

        if (downloadError || !pdfData) {
            throw new Error(
                `Failed to download PDF: ${
                    downloadError?.message || 'Unknown error'
                }`
            );
        }

        // Convert blob to buffer
        const arrayBuffer = await pdfData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Extract text using pdf-parse (dynamic import for ESM compatibility)
        const pdfParseModule = await import('pdf-parse');
        // Handle both default export and namespace export
        type PdfParseFunction = (
            data: Buffer
        ) => Promise<{ text: string; [key: string]: unknown }>;
        const pdfParse: PdfParseFunction =
            'default' in pdfParseModule &&
            typeof pdfParseModule.default === 'function'
                ? (pdfParseModule.default as unknown as PdfParseFunction)
                : (pdfParseModule as unknown as PdfParseFunction);
        const pdfInfo = await pdfParse(buffer);

        return pdfInfo.text || '';
    } catch (error) {
        console.error('[PDF_EXTRACTOR] Error extracting PDF text:', error);
        throw new Error(
            `Failed to extract PDF text: ${
                error instanceof Error ? error.message : 'Unknown error'
            }`
        );
    }
}
