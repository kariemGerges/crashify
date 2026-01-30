/**
 * CICOP AI Analysis Service
 *
 * Provides AI-powered analysis for:
 * - Email content analysis
 * - Complaint detection
 * - Follow-up classification
 * - Risk assessment
 *
 * Uses Claude API with fallback to rule-based detection
 */

import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/server/lib/supabase/client';
import crypto from 'crypto';

const MODEL_VERSION = 'claude-3-5-haiku-20241022';

export interface EmailAnalysisResult {
    claim_reference: string | null;
    vehicle_rego: string | null;
    insurer_name: string | null;
    urgency: 'urgent' | 'normal';
    requires_attention: boolean;
    confidence: number;
    method: 'ai' | 'fallback' | 'cached';
    model_version?: string;
}

export interface ComplaintDetectionResult {
    is_complaint: boolean;
    complaint_type:
        | 'service_quality'
        | 'delay'
        | 'communication'
        | 'regulatory'
        | 'other'
        | null;
    severity: 'low' | 'medium' | 'high' | null;
    confidence: number;
    method: 'ai' | 'fallback';
    keywords?: string[];
}

export class CICOPAIService {
    private client: Anthropic | null = null;
    private aiAvailable: boolean = false;
    private confidenceThreshold: number = 0.75;
    private enableCaching: boolean = true;

    constructor() {
        const apiKey = process.env.ANTHROPIC_API_KEY_two;

        if (apiKey) {
            try {
                this.client = new Anthropic({ apiKey });
                this.aiAvailable = true;
                console.log(
                    '✅ Claude API initialized for CICOP:',
                    MODEL_VERSION
                );
            } catch (error) {
                console.error('❌ Failed to initialize Claude API:', error);
                this.aiAvailable = false;
            }
        } else {
            console.warn(
                '⚠️  ANTHROPIC_API_KEY not found - using fallback rule-based detection'
            );
            this.aiAvailable = false;
        }
    }

    /**
     * Compute hash for caching
     */
    private computeHash(content: string): string {
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    /**
     * Check cache for analysis result
     */
    private async getCache(
        contentHash: string,
        modelVersion: string
    ): Promise<any | null> {
        if (!this.enableCaching) return null;

        try {
            const supabase = createServerClient();
            const { data, error } = await (supabase as any)
                .from('cicop_ai_cache')
                .select('response, confidence, hits')
                .eq('content_hash', contentHash)
                .eq('model_version', modelVersion)
                .single();

            if (error || !data) return null;

            // Update hit counter
            await (supabase as any)
                .from('cicop_ai_cache')
                .update({
                    hits: (data.hits || 0) + 1,
                    last_used_at: new Date().toISOString(),
                })
                .eq('content_hash', contentHash);

            return data.response;
        } catch (error) {
            console.error('Error getting cache:', error);
            return null;
        }
    }

    /**
     * Save to cache
     */
    private async saveCache(
        contentHash: string,
        modelVersion: string,
        promptType: string,
        response: any,
        confidence: number
    ): Promise<void> {
        if (!this.enableCaching) return;

        try {
            const supabase = createServerClient();
            await (supabase as any).from('cicop_ai_cache').insert({
                content_hash: contentHash,
                model_version: modelVersion,
                prompt_type: promptType,
                response,
                confidence,
            });
        } catch (error) {
            console.error('Error saving cache:', error);
        }
    }

    /**
     * Analyze email content with AI or fallback
     */
    async analyzeEmail(emailData: {
        subject: string;
        sender: string;
        content: string;
    }): Promise<EmailAnalysisResult> {
        const { subject, sender, content } = emailData;
        const contentHash = this.computeHash(`${subject}|${sender}|${content}`);

        // Check cache
        if (this.enableCaching) {
            const cached = await this.getCache(contentHash, MODEL_VERSION);
            if (cached) {
                console.log('💾 Using cached AI analysis');
                return { ...cached, method: 'cached' };
            }
        }

        // Try AI first
        if (this.aiAvailable && this.client) {
            try {
                const result = await this.analyzeWithAI(emailData);

                // Cache if confident
                if (result.confidence >= this.confidenceThreshold) {
                    await this.saveCache(
                        contentHash,
                        MODEL_VERSION,
                        'email_analysis',
                        result,
                        result.confidence
                    );
                }

                // Log audit
                await this.logAudit('ai_analysis', 'email_analyzed', {
                    sender,
                    confidence: result.confidence,
                    method: 'ai',
                });

                return result;
            } catch (error) {
                console.error('❌ AI analysis failed:', error);
                console.warn('⚠️  Falling back to rule-based detection');
            }
        }

        // Fallback to rules
        const result = this.analyzeWithRules(emailData);

        await this.logAudit('ai_analysis', 'fallback_used', {
            sender,
            reason: this.aiAvailable ? 'ai_error' : 'ai_unavailable',
        });

        return result;
    }

    /**
     * AI-based analysis
     */
    private async analyzeWithAI(emailData: {
        subject: string;
        sender: string;
        content: string;
    }): Promise<EmailAnalysisResult> {
        if (!this.client) throw new Error('AI client not initialized');

        const { subject, sender, content } = emailData;

        const prompt = `Analyze this insurance claim email and extract key information.

Email Details:
- From: ${sender}
- Subject: ${subject}
- Content: ${content}

Extract and return ONLY valid JSON with these fields:
{
    "claim_reference": "claim/job number if found, else null",
    "vehicle_rego": "vehicle registration if found, else null",
    "insurer_name": "insurance company name if found, else null",
    "urgency": "urgent or normal",
    "requires_attention": true/false,
    "confidence": 0.0-1.0
}

Rules:
- claim_reference: Look for patterns like "Claim #123", "Job 456", "Ref: ABC123"
- vehicle_rego: Australian format, usually 3-4 letters + 2-3 numbers
- urgency: "urgent" if mentions rush/urgent/asap, else "normal"
- requires_attention: true if high-value claim, complex, or urgent
- confidence: your confidence in the extraction (0-1)

Return ONLY the JSON, no other text.`;

        const response = await this.client.messages.create({
            model: MODEL_VERSION,
            max_tokens: 500,
            messages: [{ role: 'user', content: prompt }],
        });

        const responseText =
            response.content[0].type === 'text'
                ? response.content[0].text.trim()
                : '';

        // Parse JSON response
        try {
            const result = JSON.parse(responseText);
            return {
                ...result,
                method: 'ai',
                model_version: MODEL_VERSION,
            };
        } catch (error) {
            // Try to extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                return {
                    ...result,
                    method: 'ai',
                    model_version: MODEL_VERSION,
                };
            }
            throw new Error('AI response was not valid JSON');
        }
    }

    /**
     * Rule-based analysis (fallback)
     */
    private analyzeWithRules(emailData: {
        subject: string;
        sender: string;
        content: string;
    }): EmailAnalysisResult {
        const { subject, sender, content } = emailData;
        const combined = `${subject} ${content}`.toLowerCase();

        // Extract claim reference
        let claim_reference: string | null = null;
        const claimPatterns = [
            /claim\s*#?\s*(\w+)/i,
            /job\s*#?\s*(\w+)/i,
            /ref\s*:?\s*(\w+)/i,
            /reference\s*:?\s*(\w+)/i,
        ];
        for (const pattern of claimPatterns) {
            const match = combined.match(pattern);
            if (match) {
                claim_reference = match[1];
                break;
            }
        }

        // Extract vehicle rego
        let vehicle_rego: string | null = null;
        const regoPatterns = [
            /\b([A-Z]{3}[- ]?\d{2,3})\b/i,
            /\b([A-Z]{2,4}[- ]?\d{2,3})\b/i,
            /rego\s*:?\s*([A-Z0-9]{5,7})/i,
        ];
        for (const pattern of regoPatterns) {
            const match = content.match(pattern);
            if (match) {
                vehicle_rego = match[1].replace(/[-\s]/g, '');
                break;
            }
        }

        // Determine urgency
        const urgentKeywords = [
            'urgent',
            'asap',
            'immediate',
            'rush',
            'emergency',
        ];
        const urgency: 'urgent' | 'normal' = urgentKeywords.some(kw =>
            combined.includes(kw)
        )
            ? 'urgent'
            : 'normal';

        // Requires attention
        const attentionKeywords = [
            'important',
            'urgent',
            'high value',
            'total loss',
            'injury',
        ];
        const requires_attention = attentionKeywords.some(kw =>
            combined.includes(kw)
        );

        // Insurer name
        let insurer_name: string | null = null;
        if (sender.includes('@')) {
            const domain = sender.split('@')[1];
            insurer_name = domain.split('.')[0].toUpperCase();
        }

        return {
            claim_reference,
            vehicle_rego,
            insurer_name,
            urgency,
            requires_attention,
            confidence: 0.6,
            method: 'fallback',
        };
    }

    /**
     * Detect if email is a complaint
     */
    async detectComplaint(emailData: {
        subject: string;
        content: string;
    }): Promise<ComplaintDetectionResult | null> {
        const { subject, content } = emailData;

        // Try AI first
        if (this.aiAvailable && this.client) {
            try {
                return await this.detectComplaintAI(emailData);
            } catch (error) {
                console.error('AI complaint detection failed:', error);
            }
        }

        // Fallback to rules
        return this.detectComplaintRules(emailData);
    }

    /**
     * AI-based complaint detection
     */
    private async detectComplaintAI(emailData: {
        subject: string;
        content: string;
    }): Promise<ComplaintDetectionResult | null> {
        if (!this.client) return null;

        const { subject, content } = emailData;

        const prompt = `Analyze this email to detect if it's a COMPLAINT about service/quality.

Email:
Subject: ${subject}
Content: ${content}

A complaint is:
- Customer expressing dissatisfaction
- Service quality issues
- Delays/poor communication
- Unprofessional behavior
- Regulatory concerns

Return ONLY valid JSON:
{
    "is_complaint": true/false,
    "complaint_type": "service_quality|delay|communication|regulatory|other" or null,
    "severity": "low|medium|high" or null,
    "confidence": 0.0-1.0,
    "keywords_found": ["list", "of", "keywords"]
}

Return ONLY JSON, no other text.`;

        const response = await this.client.messages.create({
            model: MODEL_VERSION,
            max_tokens: 300,
            messages: [{ role: 'user', content: prompt }],
        });

        const responseText =
            response.content[0].type === 'text'
                ? response.content[0].text.trim()
                : '';

        try {
            const result = JSON.parse(responseText);

            if (result.is_complaint && result.confidence >= 0.7) {
                return {
                    is_complaint: true,
                    complaint_type: result.complaint_type,
                    severity: result.severity,
                    confidence: result.confidence,
                    method: 'ai',
                    keywords: result.keywords_found,
                };
            }

            return null;
        } catch (error) {
            console.error('Failed to parse AI complaint detection response');
            return null;
        }
    }

    /**
     * Rule-based complaint detection
     */
    private detectComplaintRules(emailData: {
        subject: string;
        content: string;
    }): ComplaintDetectionResult | null {
        const { subject, content } = emailData;
        const combined = `${subject} ${content}`.toLowerCase();

        const highSeverity = [
            'complaint',
            'unacceptable',
            'disgust',
            'appalled',
            'legal action',
            'lawyer',
            'ombudsman',
            'regulatory',
        ];

        const mediumSeverity = [
            'disappointed',
            'unhappy',
            'frustrated',
            'poor service',
            'unprofessional',
            'delay',
            'waiting',
            'slow',
        ];

        const lowSeverity = [
            'concerned',
            'issue',
            'problem',
            'not satisfied',
            'expected better',
            'improvement needed',
        ];

        const highCount = highSeverity.filter(kw =>
            combined.includes(kw)
        ).length;
        const mediumCount = mediumSeverity.filter(kw =>
            combined.includes(kw)
        ).length;
        const lowCount = lowSeverity.filter(kw => combined.includes(kw)).length;

        let severity: 'high' | 'medium' | 'low' | null = null;
        let confidence = 0;

        if (highCount >= 1) {
            severity = 'high';
            confidence = 0.85;
        } else if (mediumCount >= 2) {
            severity = 'medium';
            confidence = 0.75;
        } else if (lowCount >= 2 || mediumCount >= 1) {
            severity = 'low';
            confidence = 0.65;
        } else {
            return null;
        }

        // Determine type
        let complaint_type: any = 'other';
        if (
            ['delay', 'slow', 'waiting', 'time'].some(kw =>
                combined.includes(kw)
            )
        ) {
            complaint_type = 'delay';
        } else if (
            ['communication', 'response', 'call', 'email'].some(kw =>
                combined.includes(kw)
            )
        ) {
            complaint_type = 'communication';
        } else if (
            ['quality', 'poor', 'bad', 'terrible'].some(kw =>
                combined.includes(kw)
            )
        ) {
            complaint_type = 'service_quality';
        } else if (
            ['ombudsman', 'legal', 'regulatory'].some(kw =>
                combined.includes(kw)
            )
        ) {
            complaint_type = 'regulatory';
        }

        return {
            is_complaint: true,
            complaint_type,
            severity,
            confidence,
            method: 'fallback',
        };
    }

    /**
     * Detect if email contains regulatory questions (AFCA, ombudsman, legal, etc.)
     * v5.1 – audit only; no special response.
     */
    detectRegulatoryQuestion(emailData: {
        subject: string;
        content: string;
    }): { has_regulatory_content: true; keywords: string[]; confidence: number } | null {
        const combined = `${emailData.subject} ${emailData.content}`.toLowerCase();
        const regulatoryKeywords = [
            'afca',
            'ombudsman',
            'financial complaints',
            'regulatory',
            'compliance',
            'legal action',
            'lawyer',
            'solicitor',
            'consumer protection',
            'fair trading',
            'accc',
            'insurance council',
            'tribunal',
            'dispute resolution',
        ];
        const found = regulatoryKeywords.filter(kw => combined.includes(kw));
        if (found.length === 0) return null;
        return {
            has_regulatory_content: true,
            keywords: found,
            confidence: 0.9,
        };
    }

    /**
     * Detect repairer submission (supplementary quote/images).
     * v5.1 – must have attachment indicators or repairer keywords/domain.
     */
    detectRepairerSubmission(emailData: {
        subject: string;
        content: string;
        sender: string;
        hasAttachments?: boolean;
    }): {
        is_repairer: true;
        submission_type: string;
        keywords: string[];
        has_attachments: boolean;
        confidence: number;
    } | null {
        const subject = (emailData.subject || '').toLowerCase();
        const content = (emailData.content || '').toLowerCase();
        const sender = (emailData.sender || '').toLowerCase();
        const combined = `${subject} ${content}`;

        const repairerKeywords = [
            'supplementary quote',
            'revised quote',
            'updated quote',
            'repair estimate',
            'workshop quote',
            'quote revision',
            'further damage',
            'additional repair',
        ];
        const attachmentKeywords = [
            'photos attached',
            'images attached',
            'pictures attached',
            'photos included',
            'images included',
        ];
        const repairerDomains = [
            'repairer',
            'smash',
            'panel',
            'auto',
            'collision',
            'bodyshop',
            'workshop',
        ];

        const isRepairerDomain = repairerDomains.some(d => sender.includes(d));
        const foundRepairer = repairerKeywords.filter(kw => combined.includes(kw));
        const foundAttachment = attachmentKeywords.filter(kw => combined.includes(kw));

        const customerFollowupPatterns = [
            'supp for claim',
            'supplement for claim',
            'for claim no',
            'claim number',
        ];
        if (customerFollowupPatterns.some(p => subject.includes(p))) {
            return null;
        }

        if (
            foundRepairer.length === 0 &&
            foundAttachment.length === 0 &&
            !isRepairerDomain
        ) {
            return null;
        }

        const hasAttachmentKeywords =
            foundAttachment.length > 0 ||
            /attached|attachment|please find|photo|image|picture|file|document|pdf|jpg|png/i.test(
                combined
            );
        const hasAttachments =
            Boolean(emailData.hasAttachments) || hasAttachmentKeywords;
        if (!hasAttachments) return null;

        const submissionType = combined.includes('quote')
            ? 'supplementary_quote'
            : 'images';

        return {
            is_repairer: true,
            submission_type: submissionType,
            keywords: [...foundRepairer, ...foundAttachment],
            has_attachments: hasAttachments,
            confidence: isRepairerDomain ? 0.9 : 0.75,
        };
    }

    /**
     * Classify follow-up email intent.
     * Returns: info_request | status_update | complaint | additional_info | other
     */
    async classifyFollowUp(
        emailData: { content: string },
        _claimRef: string
    ): Promise<string> {
        const content = (emailData.content || '').toLowerCase();
        if (['status', 'update', 'when', 'how long', 'eta'].some(kw => content.includes(kw))) {
            return 'info_request';
        }
        if (['attached', 'photo', 'document', 'here is'].some(kw => content.includes(kw))) {
            return 'additional_info';
        }
        if (['complaint', 'disappointed', 'unacceptable'].some(kw => content.includes(kw))) {
            return 'complaint';
        }
        if (['update', 'fyi', 'please note'].some(kw => content.includes(kw))) {
            return 'status_update';
        }
        return 'other';
    }

    /**
     * Log audit event
     */
    private async logAudit(
        eventType: string,
        action: string,
        details: any
    ): Promise<void> {
        try {
            const supabase = createServerClient();
            await (supabase as any).from('cicop_audit_log').insert({
                event_type: eventType,
                action,
                actor: `ai:${MODEL_VERSION}`,
                details,
                success: true,
            });
        } catch (error) {
            console.error('Error logging audit:', error);
        }
    }
}

// Export singleton instance
export const cicopAIService = new CICOPAIService();
