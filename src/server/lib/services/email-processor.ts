// =============================================
// FILE: lib/services/email-processor.ts
// Email processing service for intake@crashify.com.au
// =============================================

import Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { createServerClient } from '@/server/lib/supabase/client';
import type { Database } from '@/server/lib/types/database.types';
import pdfParse from 'pdf-parse';

type AssessmentInsert = Database['public']['Tables']['assessments']['Insert'];
type UploadedFileInsert = Database['public']['Tables']['uploaded_files']['Insert'];

interface EmailProcessingResult {
    success: boolean;
    processed: number;
    created: number;
    errors: Array<{ emailId: string; error: string }>;
}

interface ExtractedData {
    claimReference?: string;
    vehicleInfo?: {
        year?: string;
        make?: string;
        model?: string;
        registration?: string;
    };
    insuredName?: string;
    incidentDescription?: string;
    repairerInfo?: {
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
    };
}

export class EmailProcessor {
    private imap: Imap | null = null;
    private supabase = createServerClient();

    /**
     * Connect to IMAP server
     */
    private async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            const config = {
                user: process.env.IMAP_USER || 'intake@crashify.com.au',
                password: process.env.IMAP_PASSWORD || '',
                host: process.env.IMAP_HOST || 'imap.outlook.com',
                port: parseInt(process.env.IMAP_PORT || '993', 10),
                tls: true,
                tlsOptions: { rejectUnauthorized: false },
            };

            if (!config.password) {
                reject(new Error('IMAP_PASSWORD environment variable is required'));
                return;
            }

            this.imap = new Imap(config);

            this.imap.once('ready', () => {
                console.log('[EmailProcessor] Connected to IMAP server');
                resolve();
            });

            this.imap.once('error', (err: Error) => {
                console.error('[EmailProcessor] IMAP error:', err);
                reject(err);
            });

            this.imap.connect();
        });
    }

    /**
     * Disconnect from IMAP server
     */
    private async disconnect(): Promise<void> {
        if (this.imap) {
            this.imap.end();
            this.imap = null;
        }
    }

    /**
     * Process all unread emails
     */
    async processUnreadEmails(): Promise<EmailProcessingResult> {
        const result: EmailProcessingResult = {
            success: true,
            processed: 0,
            created: 0,
            errors: [],
        };

        try {
            await this.connect();

            await new Promise<void>((resolve, reject) => {
                if (!this.imap) {
                    reject(new Error('IMAP not connected'));
                    return;
                }

                this.imap.openBox('INBOX', false, (err, box) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Search for unread emails
                    this.imap!.search(['UNSEEN'], (searchErr, results) => {
                        if (searchErr) {
                            reject(searchErr);
                            return;
                        }

                        if (!results || results.length === 0) {
                            console.log('[EmailProcessor] No unread emails found');
                            resolve();
                            return;
                        }

                        console.log(`[EmailProcessor] Found ${results.length} unread emails`);

                        // Fetch emails using UIDs
                        const fetch = this.imap!.fetch(results, {
                            bodies: '',
                            struct: true,
                        });

                        const emails: Array<{ uid: number; parsed: ParsedMail }> = [];

                        fetch.on('message', (msg) => {
                            let buffer = Buffer.alloc(0);
                            let uid: number | null = null;

                            msg.on('attributes', (attrs) => {
                                uid = attrs.uid || null;
                            });

                            msg.on('body', (stream) => {
                                stream.on('data', (chunk: Buffer) => {
                                    buffer = Buffer.concat([buffer, chunk]);
                                });
                            });

                            msg.once('end', async () => {
                                if (!uid) {
                                    console.error('[EmailProcessor] No UID found for email');
                                    return;
                                }

                                try {
                                    const parsed = await simpleParser(buffer);
                                    emails.push({ uid, parsed });
                                } catch (parseErr) {
                                    console.error(`[EmailProcessor] Failed to parse email ${uid}:`, parseErr);
                                    result.errors.push({
                                        emailId: `uid-${uid}`,
                                        error: parseErr instanceof Error ? parseErr.message : 'Parse error',
                                    });
                                }
                            });
                        });

                        fetch.once('error', (fetchErr) => {
                            reject(fetchErr);
                        });

                        fetch.once('end', async () => {
                            // Process each email
                            for (const email of emails) {
                                try {
                                    result.processed++;
                                    const created = await this.processEmail(email.parsed, email.uid);
                                    if (created) {
                                        result.created++;
                                    }
                                } catch (emailErr) {
                                    console.error(`[EmailProcessor] Failed to process email ${email.uid}:`, emailErr);
                                    result.errors.push({
                                        emailId: `uid-${email.uid}`,
                                        error: emailErr instanceof Error ? emailErr.message : 'Processing error',
                                    });
                                }
                            }

                            resolve();
                        });
                    });
                });
            });

            await this.disconnect();
        } catch (err) {
            console.error('[EmailProcessor] Error processing emails:', err);
            result.success = false;
            result.errors.push({
                emailId: 'system',
                error: err instanceof Error ? err.message : 'Unknown error',
            });
        }

        return result;
    }

    /**
     * Process a single email
     */
    private async processEmail(email: ParsedMail, uid: number): Promise<boolean> {
        try {
            // Extract data from email body
            const extractedData = this.extractDataFromEmail(email);

            // Extract data from PDF attachments
            if (email.attachments && email.attachments.length > 0) {
                for (const attachment of email.attachments) {
                    if (attachment.contentType === 'application/pdf') {
                        const pdfData = await this.extractDataFromPDF(attachment.content);
                        // Merge PDF data with email data
                        Object.assign(extractedData, pdfData);
                    }
                }
            }

            // Check for duplicates
            const isDuplicate = await this.checkDuplicate(extractedData);
            if (isDuplicate) {
                console.log(`[EmailProcessor] Duplicate detected for email ${uid}, skipping`);
                return false;
            }

            // Create assessment
            const assessmentId = await this.createAssessmentFromEmail(email, extractedData);

            // Download and save attachments (photos)
            if (email.attachments && email.attachments.length > 0) {
                await this.saveAttachments(assessmentId, email.attachments);
            }

            // Mark email as read
            await this.markEmailAsRead(uid);

            return true;
        } catch (err) {
            console.error(`[EmailProcessor] Error processing email ${uid}:`, err);
            throw err;
        }
    }

    /**
     * Extract data from email body using pattern matching
     */
    private extractDataFromEmail(email: ParsedMail): ExtractedData {
        const data: ExtractedData = {};
        const text = email.text || email.html || '';

        // Extract claim reference
        const claimMatch = text.match(/Claim:?\s*([A-Z0-9\-]+)/i);
        if (claimMatch) {
            data.claimReference = claimMatch[1];
        }

        // Extract vehicle info
        const vehicleMatch = text.match(/Vehicle:?\s*(.*?)(?:\n|$)/i);
        if (vehicleMatch) {
            const vehicleStr = vehicleMatch[1];
            // Try to parse: "2021 Toyota Camry Hybrid ABC123"
            const yearMatch = vehicleStr.match(/(\d{4})/);
            if (yearMatch) {
                data.vehicleInfo = { year: yearMatch[1] };
            }

            // Extract make/model (basic parsing)
            const makeModelMatch = vehicleStr.match(/(Toyota|Honda|Mazda|Ford|Holden|BMW|Mercedes|Audi|Volkswagen|Hyundai|Kia|Nissan|Subaru|Mitsubishi|Lexus|Jeep|Volvo|Peugeot|Renault|Skoda|Suzuki|Isuzu|LDV|Great Wall|MG|BYD|Tesla|Polestar|Genesis|Alfa Romeo|Fiat|Chrysler|Dodge|RAM|GMC|Cadillac|Lincoln|Infiniti|Acura|Porsche|Jaguar|Land Rover|Mini|Smart|Ferrari|Lamborghini|Maserati|Bentley|Rolls-Royce|Aston Martin|McLaren|Lotus|Alpine|Cupra|SEAT|Opel|Vauxhall|Citroen|DS|Dacia|Lada|Tata|Mahindra|Chery|Haval|Great Wall|GWM|ORA|BYD|MG|LDV|Maxus|Foton|JAC|Geely|Proton|Perodua|Suzuki|Daihatsu|Isuzu|Mazda|Mitsubishi|Nissan|Subaru|Toyota|Honda|Hyundai|Kia|Genesis)\s+([A-Za-z0-9\s\-]+)/i);
            if (makeModelMatch) {
                data.vehicleInfo = {
                    ...data.vehicleInfo,
                    make: makeModelMatch[1],
                    model: makeModelMatch[2].trim(),
                };
            }

            // Extract registration
            const regoMatch = vehicleStr.match(/([A-Z0-9]{1,6})/i);
            if (regoMatch && !data.vehicleInfo?.registration) {
                data.vehicleInfo = {
                    ...data.vehicleInfo,
                    registration: regoMatch[1].toUpperCase(),
                };
            }
        }

        // Extract insured name
        const insuredMatch = text.match(/Insured:?\s*(.*?)(?:\n|$)/i);
        if (insuredMatch) {
            data.insuredName = insuredMatch[1].trim();
        }

        // Extract incident description
        const incidentMatch = text.match(/Incident:?\s*(.*?)(?:\n\n|\n[A-Z]|$)/is);
        if (incidentMatch) {
            data.incidentDescription = incidentMatch[1].trim();
        }

        return data;
    }

    /**
     * Extract data from PDF (repairer info)
     */
    private async extractDataFromPDF(pdfBuffer: Buffer): Promise<Partial<ExtractedData>> {
        try {
            const data = await pdfParse(pdfBuffer);
            const text = data.text;

            const repairerInfo: ExtractedData['repairerInfo'] = {};

            // Extract email
            const emailMatch = text.match(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);
            if (emailMatch) {
                repairerInfo.email = emailMatch[1];
            }

            // Extract phone
            const phoneMatch = text.match(/(\(?\d{2}\)?\s?\d{4}\s?\d{4})/);
            if (phoneMatch) {
                repairerInfo.phone = phoneMatch[1];
            }

            // Extract company name (first line or line with ABN)
            const lines = text.split('\n').filter(line => line.trim().length > 0);
            const abnMatch = text.match(/ABN:?\s*(\d{2}\s?\d{3}\s?\d{3}\s?\d{3})/i);
            if (abnMatch) {
                // Find line before ABN line
                const abnIndex = lines.findIndex(line => line.includes('ABN'));
                if (abnIndex > 0) {
                    repairerInfo.name = lines[abnIndex - 1].trim();
                }
            } else if (lines.length > 0) {
                // Use first non-empty line as company name
                repairerInfo.name = lines[0].trim();
            }

            // Extract address (line with state/postcode)
            const addressMatch = text.match(/(\d+[^,]*,\s*[^,]*,\s*[A-Z]{2,3}\s+\d{4})/i);
            if (addressMatch) {
                repairerInfo.address = addressMatch[1].trim();
            }

            return { repairerInfo };
        } catch (err) {
            console.error('[EmailProcessor] Error extracting PDF data:', err);
            return {};
        }
    }

    /**
     * Check for duplicate assessments
     */
    private async checkDuplicate(data: ExtractedData): Promise<boolean> {
        if (!data.claimReference && !data.vehicleInfo?.registration) {
            return false; // Can't check without identifiers
        }

        // Build query based on available data
        let query = this.supabase
            .from('assessments')
            .select('id')
            .is('deleted_at', null)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

        if (data.claimReference && data.vehicleInfo?.registration) {
            query = query.or(`claim_reference.eq.${data.claimReference},registration.eq.${data.vehicleInfo.registration}`);
        } else if (data.claimReference) {
            query = query.eq('claim_reference', data.claimReference);
        } else if (data.vehicleInfo?.registration) {
            query = query.eq('registration', data.vehicleInfo.registration);
        } else {
            return false; // Can't check without identifiers
        }

        const { data: existing } = await query.limit(1);

        return (existing?.length || 0) > 0;
    }

    /**
     * Create assessment from email data
     */
    private async createAssessmentFromEmail(
        email: ParsedMail,
        extractedData: ExtractedData
    ): Promise<string> {
        const fromEmail = email.from?.value[0]?.address || '';
        const fromName = email.from?.value[0]?.name || '';

        // Determine company name from email domain
        const domain = fromEmail.split('@')[1] || '';
        const companyName = this.getCompanyNameFromDomain(domain) || fromName || domain;

        // Parse owner info
        const ownerInfo: any = {};
        if (extractedData.insuredName) {
            const nameParts = extractedData.insuredName.split(' ');
            ownerInfo.firstName = nameParts[0] || '';
            ownerInfo.lastName = nameParts.slice(1).join(' ') || '';
        }

        const assessmentData: AssessmentInsert = {
            company_name: companyName,
            your_name: fromName,
            your_email: fromEmail,
            your_phone: '', // Not available from email
            assessment_type: 'Desktop Assessment', // Default
            claim_reference: extractedData.claimReference || null,
            make: extractedData.vehicleInfo?.make || '',
            model: extractedData.vehicleInfo?.model || '',
            year: extractedData.vehicleInfo?.year ? parseInt(extractedData.vehicleInfo.year) : null,
            registration: extractedData.vehicleInfo?.registration?.toUpperCase() || null,
            owner_info: ownerInfo,
            incident_description: extractedData.incidentDescription || null,
            damage_areas: [],
            status: 'pending', // Needs manual review
            internal_notes: `Imported from email. Source: ${email.from?.value[0]?.address || 'unknown'}. Subject: ${email.subject || 'no subject'}`,
            authority_confirmed: false,
            privacy_consent: false,
            email_report_consent: false,
            sms_updates: false,
        };

        const { data, error } = await (this.supabase.from('assessments') as unknown as {
            insert: (values: AssessmentInsert[]) => {
                select: () => {
                    single: () => Promise<{
                        data: { id: string } | null;
                        error: { message: string } | null;
                    }>;
                };
            };
        })
            .insert([assessmentData])
            .select()
            .single();

        if (error || !data) {
            throw new Error(error?.message || 'Failed to create assessment');
        }

        return data.id;
    }

    /**
     * Save email attachments as files
     */
    private async saveAttachments(
        assessmentId: string,
        attachments: Array<{ filename?: string; contentType: string; content: Buffer | string }>
    ): Promise<void> {
        const BUCKET_NAME = 'Assessment-photos';

        for (const attachment of attachments) {
            // Only save images
            if (!attachment.contentType.startsWith('image/')) {
                continue;
            }

            try {
                const fileName = attachment.filename || `photo_${Date.now()}.jpg`;
                const filePath = `${assessmentId}/${Date.now()}-${fileName}`;
                const content = Buffer.isBuffer(attachment.content)
                    ? attachment.content
                    : Buffer.from(attachment.content);

                // Upload to Supabase Storage
                const { error: uploadError } = await this.supabase.storage
                    .from(BUCKET_NAME)
                    .upload(filePath, content, {
                        cacheControl: '3600',
                        upsert: false,
                    });

                if (uploadError) {
                    console.error(`[EmailProcessor] Failed to upload ${fileName}:`, uploadError);
                    continue;
                }

                // Get public URL
                const {
                    data: { publicUrl },
                } = this.supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

                // Save file record
                const fileInsert: UploadedFileInsert = {
                    assessment_id: assessmentId,
                    file_name: fileName,
                    file_url: publicUrl,
                    file_type: attachment.contentType,
                    file_size: content.length,
                    storage_path: filePath,
                    processing_status: 'uploaded',
                    metadata: {
                        source: 'email',
                        uploadedAt: new Date().toISOString(),
                    },
                };

                await (this.supabase.from('uploaded_files') as unknown as {
                    insert: (values: UploadedFileInsert[]) => Promise<unknown>;
                }).insert([fileInsert]);
            } catch (err) {
                console.error(`[EmailProcessor] Error saving attachment ${attachment.filename}:`, err);
            }
        }
    }

    /**
     * Mark email as read
     */
    private async markEmailAsRead(uid: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.imap) {
                reject(new Error('IMAP not connected'));
                return;
            }

            this.imap.addFlags(uid, '\\Seen', (err) => {
                if (err) {
                    console.error(`[EmailProcessor] Failed to mark email ${uid} as read:`, err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Get company name from email domain
     */
    private getCompanyNameFromDomain(domain: string): string | null {
        // Map common insurance company domains
        const domainMap: Record<string, string> = {
            'p2pcover.com.au': 'P2P Cover Limited',
            'nrma.com.au': 'NRMA Insurance',
            'allianz.com.au': 'Allianz Australia',
            'aami.com.au': 'AAMI',
            'gio.com.au': 'GIO',
            'suncorp.com.au': 'Suncorp',
            'racv.com.au': 'RACV',
            'racq.com.au': 'RACQ',
            'rac.com.au': 'RAC',
            'australianunity.com.au': 'Australian Unity',
        };

        return domainMap[domain.toLowerCase()] || null;
    }
}

