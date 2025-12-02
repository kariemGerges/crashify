// =============================================
// FILE: lib/services/email-quarantine.ts
// Email quarantine service (REQ-6)
// =============================================

import { createServerClient } from '@/server/lib/supabase/client';
import type { ParsedMail } from 'mailparser';
import type { Database } from '@/server/lib/types/database.types';

type EmailQuarantineInsert = Database['public']['Tables']['email_quarantine']['Insert'];

export interface QuarantineEmailParams {
    email: ParsedMail;
    emailUid: number;
    spamScore: number;
    spamFlags: string[];
    reason: string;
}

/**
 * Quarantine a suspicious email for manual review
 */
export async function quarantineEmail(params: QuarantineEmailParams): Promise<string> {
    const supabase = createServerClient();
    const { email, emailUid, spamScore, spamFlags, reason } = params;

    const quarantineData: EmailQuarantineInsert = {
        email_from: email.from?.text || email.from?.value?.[0]?.address || 'unknown',
        email_subject: email.subject || null,
        email_body: email.text || null,
        email_html: email.html || null,
        spam_score: spamScore,
        spam_flags: spamFlags,
        reason,
        email_uid: emailUid,
        attachments_count: email.attachments?.length || 0,
        raw_email_data: {
            headers: email.headers,
            date: email.date?.toISOString(),
            messageId: email.messageId,
        } as unknown as Record<string, unknown>,
        review_action: 'pending',
    };

    const { data, error } = await supabase
        .from('email_quarantine')
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

    console.log(`[EmailQuarantine] Email ${emailUid} quarantined with ID: ${data.id}`);
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
        console.error('[EmailQuarantine] Error fetching quarantined emails:', error);
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

    const { error } = await supabase
        .from('email_quarantine')
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

