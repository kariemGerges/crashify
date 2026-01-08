// =============================================
// FILE: server/lib/services/claude-service.ts
// Claude AI Integration Service (REQ-32 to REQ-36)
// =============================================

import Anthropic from '@anthropic-ai/sdk';

/**
 * Get Anthropic client instance (lazy initialization)
 * Checks for API key only when actually needed
 */
function getAnthropicClient(): Anthropic {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    return new Anthropic({
        apiKey,
    });
}

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

        const message = await getAnthropicClient().messages.create({
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
            const parsed = JSON.parse(responseText) as {
                damageDetected?: boolean;
                damageAreas?: string[];
                damageDescription?: string;
                severity?: 'minor' | 'moderate' | 'severe' | 'total_loss';
                estimatedRepairCost?: number;
                recommendations?: string[];
            };
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

        const message = await getAnthropicClient().messages.create({
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

        const message = await getAnthropicClient().messages.create({
            model: 'claude-3-5-sonnet',
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

        const message = await getAnthropicClient().messages.create({
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

        const message = await getAnthropicClient().messages.create({
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
 * Extract claim/assessment information from email and PDF attachments using Claude AI
 */
export interface ClaimExtractionResult {
    // Company/Contact Info
    company_name?: string;
    your_name?: string;
    your_email?: string;
    your_phone?: string;
    your_role?: string;
    department?: string;
    
    // Assessment Details
    assessment_type?: 'Desktop Assessment' | 'Onsite Assessment';
    claim_reference?: string;
    policy_number?: string;
    incident_date?: string; // ISO date string
    incident_location?: string;
    
    // Vehicle Info
    vehicle_type?: string;
    year?: number;
    make?: string;
    model?: string;
    registration?: string;
    vin?: string;
    color?: string;
    odometer?: number;
    
    // Insurance Info
    insurance_value_type?: string;
    insurance_value_amount?: number;
    
    // Owner Info (will be converted to JSON)
    owner_info?: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        address?: string;
    };
    
    // Location Info (will be converted to JSON)
    location_info?: {
        address?: string;
        suburb?: string;
        state?: string;
        postcode?: string;
        country?: string;
    };
    
    // Incident Details
    incident_description?: string;
    damage_areas?: string[];
    special_instructions?: string;
    
    // Confidence score (0-100)
    confidence?: number;
    extraction_notes?: string;
}

/**
 * Extract claim information from email body and PDF attachments using Claude AI
 */
export async function extractClaimFromEmail(
    emailBody: string,
    emailSubject: string,
    emailFrom: string,
    pdfTexts?: string[]
): Promise<ClaimExtractionResult> {
    try {
        // Combine all text sources
        let combinedText = `Email Subject: ${emailSubject}\n\n`;
        combinedText += `Email From: ${emailFrom}\n\n`;
        combinedText += `Email Body:\n${emailBody}\n\n`;
        
        if (pdfTexts && pdfTexts.length > 0) {
            combinedText += `\n=== PDF ATTACHMENTS ===\n\n`;
            pdfTexts.forEach((pdfText, index) => {
                combinedText += `PDF Attachment ${index + 1}:\n${pdfText}\n\n`;
            });
        }
        
        const prompt = `You are an expert at extracting vehicle insurance claim information from emails and PDF documents. Extract all relevant information from the following email and any PDF attachments.

${combinedText}

Extract and return ALL available information in JSON format. Include:
1. Company/Contact Info: company_name, your_name, your_email, your_phone, your_role, department
2. Assessment Details: assessment_type (Desktop Assessment or Onsite Assessment), claim_reference, policy_number, incident_date (ISO format: YYYY-MM-DD), incident_location
3. Vehicle Info: vehicle_type, year (as number), make, model, registration, vin, color, odometer (as number)
4. Insurance Info: insurance_value_type, insurance_value_amount (as number)
5. Owner Info: firstName, lastName, email, phone, address (as an object)
6. Location Info: address, suburb, state, postcode, country (as an object)
7. Incident Details: incident_description, damage_areas (as array), special_instructions
8. Confidence: confidence score (0-100) indicating how confident you are in the extraction
9. Extraction Notes: any notes about missing or unclear information

Important:
- Only include fields where you can extract actual data (don't make up values)
- For dates, use ISO format (YYYY-MM-DD)
- For numbers (year, odometer, insurance_value_amount), return as numbers not strings
- For damage_areas, return as an array of strings
- If information is not found, omit that field entirely
- Be thorough - extract as much information as possible from both email and PDFs
- If the same information appears in multiple places, use the most complete version

Respond ONLY with valid JSON, no additional text.`;

        const message = await getAnthropicClient().messages.create({
            model: 'claude-3-5-sonnet',
            max_tokens: 4000,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });

        const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
        
        // Try to extract JSON from response (handle cases where Claude adds explanation text)
        let jsonText = responseText.trim();
        
        // Remove markdown code blocks if present
        if (jsonText.startsWith('```')) {
            const lines = jsonText.split('\n');
            const startIndex = lines.findIndex(line => line.includes('```'));
            const endIndex = lines.findIndex((line, idx) => idx > startIndex && line.includes('```'));
            if (startIndex >= 0 && endIndex > startIndex) {
                jsonText = lines.slice(startIndex + 1, endIndex).join('\n');
            }
        }
        
        // Find JSON object in response
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonText = jsonMatch[0];
        }

        try {
            const parsed = JSON.parse(jsonText) as ClaimExtractionResult;
            
            // Validate and clean up the result
            const result: ClaimExtractionResult = {
                ...parsed,
                // Ensure assessment_type is valid
                assessment_type: parsed.assessment_type === 'Onsite Assessment' 
                    ? 'Onsite Assessment' 
                    : parsed.assessment_type === 'Desktop Assessment'
                    ? 'Desktop Assessment'
                    : undefined,
                // Ensure year is a number
                year: parsed.year ? (typeof parsed.year === 'string' ? parseInt(parsed.year) : parsed.year) : undefined,
                // Ensure odometer is a number
                odometer: parsed.odometer ? (typeof parsed.odometer === 'string' ? parseInt(parsed.odometer) : parsed.odometer) : undefined,
                // Ensure insurance_value_amount is a number
                insurance_value_amount: parsed.insurance_value_amount 
                    ? (typeof parsed.insurance_value_amount === 'string' 
                        ? parseFloat(parsed.insurance_value_amount) 
                        : parsed.insurance_value_amount) 
                    : undefined,
                // Ensure damage_areas is an array
                damage_areas: Array.isArray(parsed.damage_areas) ? parsed.damage_areas : undefined,
            };
            
            return result;
        } catch (parseError) {
            // Fallback: try to extract key fields using regex
            console.error('[CLAUDE] JSON parse error, attempting fallback extraction', parseError);
            
            return {
                company_name: extractField(responseText, 'company_name') || undefined,
                your_name: extractField(responseText, 'your_name') || undefined,
                your_email: extractField(responseText, 'your_email') || emailFrom || undefined,
                your_phone: extractField(responseText, 'your_phone') || undefined,
                claim_reference: extractField(responseText, 'claim_reference') || undefined,
                policy_number: extractField(responseText, 'policy_number') || undefined,
                make: extractField(responseText, 'make') || undefined,
                model: extractField(responseText, 'model') || undefined,
                registration: extractField(responseText, 'registration') || undefined,
                incident_description: emailBody.substring(0, 1000) || undefined,
                confidence: 30, // Low confidence for fallback
                extraction_notes: 'JSON parsing failed, used fallback extraction',
            };
        }
    } catch (error) {
        console.error('[CLAUDE] Claim extraction error:', error);
        throw new Error(
            `Failed to extract claim information: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Validate if an email is a valid claim/assessment request using Claude AI
 */
export interface EmailValidationResult {
    isValidClaim: boolean;
    confidence: number; // 0-100
    reasoning: string;
    rejectionReason?: string;
    isSpam?: boolean;
    isMarketing?: boolean;
    isSystemNotification?: boolean;
}

/**
 * Validate if an email is a valid claim/assessment request using Claude AI
 */
export async function validateEmailAsClaim(
    emailBody: string,
    emailSubject: string,
    emailFrom: string
): Promise<EmailValidationResult> {
    try {
        const prompt = `You are an expert at identifying vehicle insurance claim and assessment request emails. Analyze the following email to determine if it is a legitimate claim/assessment request.

Email From: ${emailFrom}
Email Subject: ${emailSubject}
Email Body:
${emailBody.substring(0, 2000)}

Determine if this email is:
1. A valid vehicle insurance claim or assessment request (should process)
2. Spam, marketing, promotional, or system notification (should reject)
3. Unclear or ambiguous (should reject to be safe)

Valid claim emails typically contain:
- Vehicle information (make, model, year, registration, VIN)
- Incident details (accident, damage, claim reference)
- Insurance/claim information
- Request for assessment or quote
- Contact information for the claimant

Invalid emails include:
- Marketing/promotional emails
- System notifications (like Microsoft security alerts)
- Spam or phishing attempts
- General inquiries not related to claims
- Automated system messages

Respond in JSON format with:
- isValidClaim: true/false
- confidence: 0-100 (how confident you are)
- reasoning: brief explanation
- rejectionReason: if isValidClaim is false, explain why
- isSpam: true/false (if it's spam)
- isMarketing: true/false (if it's marketing)
- isSystemNotification: true/false (if it's a system notification)

Respond ONLY with valid JSON, no additional text.`;

        const message = await getAnthropicClient().messages.create({
            model: 'claude-3-5-sonnet',
            max_tokens: 1000,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });

        const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
        
        // Try to extract JSON from response
        let jsonText = responseText.trim();
        if (jsonText.startsWith('```')) {
            const lines = jsonText.split('\n');
            const startIndex = lines.findIndex(line => line.includes('```'));
            const endIndex = lines.findIndex((line, idx) => idx > startIndex && line.includes('```'));
            if (startIndex >= 0 && endIndex > startIndex) {
                jsonText = lines.slice(startIndex + 1, endIndex).join('\n');
            }
        }
        
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonText = jsonMatch[0];
        }

        try {
            const parsed = JSON.parse(jsonText) as EmailValidationResult;
            return {
                isValidClaim: parsed.isValidClaim || false,
                confidence: parsed.confidence || 50,
                reasoning: parsed.reasoning || '',
                rejectionReason: parsed.rejectionReason,
                isSpam: parsed.isSpam || false,
                isMarketing: parsed.isMarketing || false,
                isSystemNotification: parsed.isSystemNotification || false,
            };
        } catch (parseError) {
            // Fallback: use basic heuristics
            const emailContent = (emailSubject + ' ' + emailBody).toLowerCase();
            const hasClaimKeywords = /claim|assessment|accident|damage|vehicle|insurance|quote|repair/i.test(emailContent);
            const isMicrosoftEmail = emailFrom.includes('microsoft.com') || emailFrom.includes('office365.com');
            const isMarketing = /promo|offer|sale|discount|newsletter|unsubscribe/i.test(emailContent);
            
            return {
                isValidClaim: hasClaimKeywords && !isMicrosoftEmail && !isMarketing,
                confidence: 40,
                reasoning: 'JSON parsing failed, used fallback heuristics',
                rejectionReason: isMicrosoftEmail ? 'System notification email' : isMarketing ? 'Marketing email' : 'Unable to determine',
                isSpam: false,
                isMarketing: isMarketing,
                isSystemNotification: isMicrosoftEmail,
            };
        }
    } catch (error) {
        console.error('[CLAUDE] Email validation error:', error);
        // On error, be conservative and reject
        return {
            isValidClaim: false,
            confidence: 0,
            reasoning: 'Validation error occurred',
            rejectionReason: 'Claude validation failed',
            isSpam: false,
            isMarketing: false,
            isSystemNotification: false,
        };
    }
}

/**
 * Extract complaint information from email and PDF attachments using Claude AI
 */
export interface ComplaintExtractionResult {
    // Complainant Info
    complainant_name?: string;
    complainant_email?: string;
    complainant_phone?: string;
    
    // Complaint Details
    category?: 'service_quality' | 'delayed_response' | 'incorrect_assessment' | 'billing_issue' | 'communication' | 'data_privacy' | 'other';
    priority?: 'critical' | 'high' | 'medium' | 'low';
    description?: string;
    
    // Assessment Reference (if mentioned)
    assessment_reference?: string;
    assessment_id?: string;
    
    // Confidence score (0-100)
    confidence?: number;
    extraction_notes?: string;
}

/**
 * Extract complaint information from email body and PDF attachments using Claude AI
 */
export async function extractComplaintFromEmail(
    emailBody: string,
    emailSubject: string,
    emailFrom: string,
    pdfTexts?: string[]
): Promise<ComplaintExtractionResult> {
    try {
        // Combine all text sources
        let combinedText = `Email Subject: ${emailSubject}\n\n`;
        combinedText += `Email From: ${emailFrom}\n\n`;
        combinedText += `Email Body:\n${emailBody}\n\n`;
        
        if (pdfTexts && pdfTexts.length > 0) {
            combinedText += `\n=== PDF ATTACHMENTS ===\n\n`;
            pdfTexts.forEach((pdfText, index) => {
                combinedText += `PDF Attachment ${index + 1}:\n${pdfText}\n\n`;
            });
        }
        
        const prompt = `You are an expert at extracting complaint information from emails and PDF documents. Extract all relevant information from the following complaint email and any PDF attachments.

${combinedText}

Extract and return ALL available information in JSON format. Include:
1. Complainant Info: complainant_name, complainant_email, complainant_phone
2. Complaint Details: category (one of: service_quality, delayed_response, incorrect_assessment, billing_issue, communication, data_privacy, other), priority (critical, high, medium, low), description (the main complaint text)
3. Assessment Reference: assessment_reference or assessment_id if mentioned in the complaint
4. Confidence: confidence score (0-100) indicating how confident you are in the extraction
5. Extraction Notes: any notes about missing or unclear information

Important:
- Only include fields where you can extract actual data (don't make up values)
- For category, choose the most appropriate one based on the complaint content
- For priority, determine based on urgency indicators (urgent, critical, immediate = critical; important, asap = high; otherwise medium or low)
- For description, provide a clear summary of the complaint (can be longer, up to 2000 characters)
- If information is not found, omit that field entirely
- Be thorough - extract as much information as possible from both email and PDFs
- If the same information appears in multiple places, use the most complete version

Respond ONLY with valid JSON, no additional text.`;

        const message = await getAnthropicClient().messages.create({
            model: 'claude-3-5-sonnet',
            max_tokens: 4000,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });

        const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
        
        // Try to extract JSON from response (handle cases where Claude adds explanation text)
        let jsonText = responseText.trim();
        
        // Remove markdown code blocks if present
        if (jsonText.startsWith('```')) {
            const lines = jsonText.split('\n');
            const startIndex = lines.findIndex(line => line.includes('```'));
            const endIndex = lines.findIndex((line, idx) => idx > startIndex && line.includes('```'));
            if (startIndex >= 0 && endIndex > startIndex) {
                jsonText = lines.slice(startIndex + 1, endIndex).join('\n');
            }
        }
        
        // Find JSON object in response
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonText = jsonMatch[0];
        }

        try {
            const parsed = JSON.parse(jsonText) as ComplaintExtractionResult;
            
            // Validate and clean up the result
            const result: ComplaintExtractionResult = {
                ...parsed,
                // Ensure category is valid
                category: parsed.category && [
                    'service_quality',
                    'delayed_response',
                    'incorrect_assessment',
                    'billing_issue',
                    'communication',
                    'data_privacy',
                    'other'
                ].includes(parsed.category)
                    ? parsed.category
                    : 'other',
                // Ensure priority is valid
                priority: parsed.priority && [
                    'critical',
                    'high',
                    'medium',
                    'low'
                ].includes(parsed.priority)
                    ? parsed.priority
                    : 'medium',
            };
            
            return result;
        } catch (parseError) {
            // Fallback: try to extract key fields using regex
            console.error('[CLAUDE] JSON parse error, attempting fallback extraction', parseError);
            
            return {
                complainant_name: extractField(responseText, 'complainant_name') || undefined,
                complainant_email: extractField(responseText, 'complainant_email') || emailFrom || undefined,
                complainant_phone: extractField(responseText, 'complainant_phone') || undefined,
                category: 'other',
                priority: 'medium',
                description: emailBody.substring(0, 2000) || undefined,
                confidence: 30, // Low confidence for fallback
                extraction_notes: 'JSON parsing failed, used fallback extraction',
            };
        }
    } catch (error) {
        console.error('[CLAUDE] Complaint extraction error:', error);
        throw new Error(
            `Failed to extract complaint information: ${error instanceof Error ? error.message : 'Unknown error'}`
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

