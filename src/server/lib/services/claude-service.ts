// =============================================
// FILE: server/lib/services/claude-service.ts
// Claude AI Integration Service (REQ-32 to REQ-36)
// =============================================

import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
}

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface PhotoAnalysisResult {
    damageDetected: boolean;
    damageAreas: string[];
    damageDescription: string;
    severity: 'minor' | 'moderate' | 'severe' | 'total_loss';
    estimatedRepairCost?: number;
    recommendations: string[];
}

export interface PDFExtractionResult {
    repairerName?: string;
    repairerEmail?: string;
    repairerPhone?: string;
    repairerAddress?: string;
    quoteAmount?: number;
    lineItems?: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }>;
    vehicleDetails?: {
        make?: string;
        model?: string;
        year?: number;
        registration?: string;
    };
}

export interface ReportGenerationData {
    assessmentId: string;
    assessmentData: Record<string, unknown>;
    photos: Array<{ url: string; description?: string }>;
    recommendations?: string[];
}

export interface SupplementaryReviewResult {
    shouldApprove: boolean;
    confidence: number;
    reasoning: string;
    recommendedAmount?: number;
    concerns: string[];
}

/**
 * Analyze damage photos using Claude AI (REQ-32)
 */
export async function analyzeDamagePhotos(
    photos: Array<{ url: string; description?: string }>
): Promise<PhotoAnalysisResult> {
    try {
        // Convert photos to base64 or use URLs
        // For now, we'll use a text-based analysis approach
        // In production, you'd send image data to Claude Vision API

        const photoDescriptions = photos
            .map((photo, index) => `Photo ${index + 1}: ${photo.description || 'No description'}`)
            .join('\n');

        const prompt = `You are an expert vehicle damage assessor. Analyze the following vehicle damage photos and provide a detailed assessment.

Photos:
${photoDescriptions}

Please provide:
1. Whether damage is detected (true/false)
2. List of damage areas (e.g., front bumper, rear quarter panel, etc.)
3. Detailed description of the damage
4. Severity assessment: minor, moderate, severe, or total_loss
5. Estimated repair cost range (if possible)
6. Recommendations for repair approach

Respond in JSON format.`;

        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2000,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });

        const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

        // Parse JSON response
        try {
            const parsed = JSON.parse(responseText);
            return {
                damageDetected: parsed.damageDetected || false,
                damageAreas: parsed.damageAreas || [],
                damageDescription: parsed.damageDescription || '',
                severity: parsed.severity || 'moderate',
                estimatedRepairCost: parsed.estimatedRepairCost,
                recommendations: parsed.recommendations || [],
            };
        } catch (parseError) {
            // Fallback if JSON parsing fails
            return {
                damageDetected: true,
                damageAreas: ['Unknown'],
                damageDescription: responseText,
                severity: 'moderate',
                recommendations: ['Review photos manually'],
            };
        }
    } catch (error) {
        console.error('[CLAUDE] Photo analysis error:', error);
        throw new Error(
            `Failed to analyze photos: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Extract data from PDF quotes using Claude AI (REQ-33)
 */
export async function extractDataFromPDF(pdfText: string): Promise<PDFExtractionResult> {
    try {
        const prompt = `You are an expert at extracting information from vehicle repair quotes. Extract the following information from this PDF text:

${pdfText}

Please extract and return in JSON format:
1. Repairer/Company name
2. Repairer email address
3. Repairer phone number
4. Repairer address
5. Total quote amount
6. Line items (description, quantity, unit price, total)
7. Vehicle details (make, model, year, registration)

If any information is not found, omit that field.`;

        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2000,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });

        const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

        try {
            const parsed = JSON.parse(responseText);
            return {
                repairerName: parsed.repairerName,
                repairerEmail: parsed.repairerEmail,
                repairerPhone: parsed.repairerPhone,
                repairerAddress: parsed.repairerAddress,
                quoteAmount: parsed.quoteAmount,
                lineItems: parsed.lineItems,
                vehicleDetails: parsed.vehicleDetails,
            };
        } catch (parseError) {
            // Fallback extraction
            return {
                repairerName: extractField(responseText, 'repairerName') || undefined,
                repairerEmail: extractField(responseText, 'repairerEmail') || undefined,
                repairerPhone: extractField(responseText, 'repairerPhone') || undefined,
                quoteAmount: parseFloat(extractField(responseText, 'quoteAmount') || '0') || undefined,
            };
        }
    } catch (error) {
        console.error('[CLAUDE] PDF extraction error:', error);
        throw new Error(
            `Failed to extract PDF data: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Generate assessment report using Claude AI (REQ-34)
 */
export async function generateAssessmentReport(
    data: ReportGenerationData
): Promise<string> {
    try {
        const prompt = `You are an expert vehicle damage assessor. Generate a professional assessment report based on the following data:

Assessment ID: ${data.assessmentId}
Assessment Data: ${JSON.stringify(data.assessmentData, null, 2)}
Photos: ${data.photos.length} photos provided
Recommendations: ${data.recommendations?.join(', ') || 'None'}

Generate a comprehensive assessment report in markdown format including:
1. Executive Summary
2. Vehicle Details
3. Damage Assessment
4. Repair Recommendations
5. Cost Analysis
6. Conclusion

Format the report professionally with clear sections and bullet points.`;

        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4000,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });

        return message.content[0].type === 'text' ? message.content[0].text : '';
    } catch (error) {
        console.error('[CLAUDE] Report generation error:', error);
        throw new Error(
            `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Review supplementary quotes using Claude AI (REQ-35)
 */
export async function reviewSupplementaryQuote(
    originalQuote: PDFExtractionResult,
    supplementaryQuote: PDFExtractionResult,
    originalAmount: number
): Promise<SupplementaryReviewResult> {
    try {
        const prompt = `You are an expert at reviewing vehicle repair supplementary quotes. Review this supplementary quote against the original quote.

Original Quote Amount: $${originalAmount}
Original Quote Details: ${JSON.stringify(originalQuote, null, 2)}

Supplementary Quote Details: ${JSON.stringify(supplementaryQuote, null, 2)}

Please analyze and provide:
1. Should this supplementary quote be approved? (true/false)
2. Confidence level (0-100)
3. Detailed reasoning
4. Recommended amount to approve (if different from quoted)
5. Any concerns or red flags

Respond in JSON format.`;

        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2000,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });

        const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

        try {
            const parsed = JSON.parse(responseText);
            return {
                shouldApprove: parsed.shouldApprove || false,
                confidence: parsed.confidence || 50,
                reasoning: parsed.reasoning || '',
                recommendedAmount: parsed.recommendedAmount,
                concerns: parsed.concerns || [],
            };
        } catch (parseError) {
            return {
                shouldApprove: false,
                confidence: 50,
                reasoning: responseText,
                concerns: ['Unable to parse AI response'],
            };
        }
    } catch (error) {
        console.error('[CLAUDE] Supplementary review error:', error);
        throw new Error(
            `Failed to review supplementary quote: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Get approve/reject recommendation (REQ-36)
 */
export async function getApproveRejectRecommendation(
    assessmentData: Record<string, unknown>,
    quoteData: PDFExtractionResult
): Promise<{
    recommendation: 'approve' | 'reject' | 'review';
    confidence: number;
    reasoning: string;
    concerns: string[];
}> {
    try {
        const prompt = `You are an expert vehicle damage assessor. Review this assessment and quote to provide an approve/reject recommendation.

Assessment Data: ${JSON.stringify(assessmentData, null, 2)}
Quote Data: ${JSON.stringify(quoteData, null, 2)}

Provide:
1. Recommendation: "approve", "reject", or "review"
2. Confidence level (0-100)
3. Detailed reasoning
4. List of concerns (if any)

Respond in JSON format.`;

        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2000,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });

        const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

        try {
            const parsed = JSON.parse(responseText);
            return {
                recommendation: (parsed.recommendation || 'review') as 'approve' | 'reject' | 'review',
                confidence: parsed.confidence || 50,
                reasoning: parsed.reasoning || '',
                concerns: parsed.concerns || [],
            };
        } catch (parseError) {
            return {
                recommendation: 'review',
                confidence: 50,
                reasoning: responseText,
                concerns: ['Unable to parse AI response'],
            };
        }
    } catch (error) {
        console.error('[CLAUDE] Recommendation error:', error);
        throw new Error(
            `Failed to get recommendation: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Helper function to extract field from text
 */
function extractField(text: string, fieldName: string): string | null {
    const regex = new RegExp(`"${fieldName}"\\s*:\\s*"([^"]+)"`, 'i');
    const match = text.match(regex);
    return match ? match[1] : null;
}

