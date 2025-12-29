// =============================================
// FILE: lib/services/email-quarantine.ts
// Email quarantine service (REQ-6)
// =============================================

import { createServerClient } from '@/server/lib/supabase/client';
import type { ParsedMail } from 'mailparser';
import type { Database, Json } from '@/server/lib/types/database.types';

type EmailQuarantineInsert =
    Database['public']['Tables']['email_quarantine']['Insert'];
type EmailQuarantineUpdate =
    Database['public']['Tables']['email_quarantine']['Update'];

export interface QuarantineEmailParams {
    email: ParsedMail;
    emailUid?: number; // IMAP UID (legacy)
    emailId?: string; // Graph API email ID (OAuth2)
    spamScore: number;
    spamFlags: string[];
    reason: string;
}

/**
 * Quarantine a suspicious email for manual review
 */
export async function quarantineEmail(
    params: QuarantineEmailParams
): Promise<string> {
    const supabase = createServerClient();
    const { email, emailUid, emailId, spamScore, spamFlags, reason } = params;

    // Convert Headers object (Map) to plain object for JSON serialization
    // HeaderValue can be string, string[], Date, AddressObject, StructuredHeader, etc.
    // Convert all to JSON-serializable format
    const headersObj: Record<string, unknown> = {};
    if (email.headers) {
        for (const [key, value] of email.headers) {
            if (value instanceof Date) {
                headersObj[key] = value.toISOString();
            } else if (typeof value === 'string' || Array.isArray(value)) {
                headersObj[key] = value;
            } else {
                // Convert complex objects (AddressObject, StructuredHeader, etc.) to JSON
                headersObj[key] = JSON.parse(JSON.stringify(value));
            }
        }
    }

    const quarantineData: EmailQuarantineInsert = {
        email_from:
            email.from?.text || email.from?.value?.[0]?.address || 'unknown',
        email_subject: email.subject || null,
        email_body: email.text || null,
        email_html: email.html || null,
        spam_score: spamScore,
        spam_flags: spamFlags,
        reason,
        email_uid: emailUid || null, // IMAP UID (legacy) or Graph API email ID stored as number if possible
        attachments_count: email.attachments?.length || 0,
        raw_email_data: {
            headers: headersObj as Json,
            date: email.date?.toISOString(),
            messageId: email.messageId,
        } as Json,
        review_action: 'pending',
    };

    const { data, error } = await (
        supabase.from('email_quarantine') as unknown as {
            insert: (values: EmailQuarantineInsert) => {
                select: (columns: string) => {
                    single: () => Promise<{
                        data: { id: string } | null;
                        error: { message: string } | null;
                    }>;
                };
            };
        }
    )
        .insert(quarantineData)
        .select('id')
        .single();

    if (error) {
        console.error('[EmailQuarantine] Error quarantining email:', error);
        throw new Error(`Failed to quarantine email: ${error.message}`);
    }

    if (!data) {
        throw new Error('Failed to quarantine email: No data returned');
    }

    const emailIdentifier = emailId || emailUid?.toString() || 'unknown';
    console.log(
        `[EmailQuarantine] Email ${emailIdentifier} quarantined with ID: ${data.id}`
    );
    return data.id;
}

/**
 * Get quarantined emails pending review
 */
export async function getQuarantinedEmails(limit = 50) {
    const supabase = createServerClient();

    const { data, error } = await supabase
        .from('email_quarantine')
        .select('*')
        .eq('review_action', 'pending')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error(
            '[EmailQuarantine] Error fetching quarantined emails:',
            error
        );
        throw new Error(`Failed to fetch quarantined emails: ${error.message}`);
    }

    return data || [];
}

/**
 * Review a quarantined email (approve/reject)
 */
export async function reviewQuarantinedEmail(
    quarantineId: string,
    action: 'approve' | 'reject',
    reviewedBy: string,
    notes?: string
): Promise<void> {
    const supabase = createServerClient();

    const { error } = await (
        supabase.from('email_quarantine') as unknown as {
            update: (values: EmailQuarantineUpdate) => {
                eq: (
                    column: string,
                    value: string
                ) => Promise<{
                    error: { message: string } | null;
                }>;
            };
        }
    )
        .update({
            review_action: action,
            reviewed_by: reviewedBy,
            reviewed_at: new Date().toISOString(),
            review_notes: notes || null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', quarantineId);

    if (error) {
        console.error('[EmailQuarantine] Error reviewing email:', error);
        throw new Error(`Failed to review email: ${error.message}`);
    }
}
