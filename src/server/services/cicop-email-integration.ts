/**
 * CICOP Email Integration Service – Auto-Responder v5.0
 *
 * Implements the full v5 flow from COMPLETE! Crashify Auto-Responder v5.0 UPDATED:
 * - Skip self-emails (monitoring address)
 * - Dedup: email_id, message_id_hash, thread_id, auto-reply detection
 * - Priority 1: Complaint (log, optional complaint ack if claim/rego, admin alert)
 * - Priority 1.5: Regulatory (audit only)
 * - Priority 1.6: Repairer submission (auto-ack from any sender)
 * - Priority 2: Follow-up (draft only, no auto-response)
 * - Priority 3: New job (authorized senders only, claim/rego required, insurer enabled)
 */

import crypto from 'crypto';
import { createServerClient } from '@/server/lib/supabase/client';
import { cicopAIService } from './cicop-ai-service';
import { cicopSlaService } from './cicop-sla-service';
import { getGreetingRecipient, getGreeting } from './name-extractor';
import { getMicrosoftGraphToken } from './microsoft-graph-auth';

interface ProcessedEmailResult {
  email_id: string;
  processed: boolean;
  sla_started: boolean;
  complaint_detected: boolean;
  auto_response_sent: boolean;
  skipped_unauthorized?: boolean;
  follow_up_handled?: boolean;
  repairer_ack_sent?: boolean;
  complaint_ack_sent?: boolean;
  error?: string;
}

interface CICOPConfig {
  email_to_monitor: string;
  authorized_senders: string[];
  insurer_override: Record<string, boolean>;
  auto_reply_enabled: boolean;
  admin_alert_email: string;
}

const AUTO_REPLY_PATTERNS = [
  /out of (the )?office/i,
  /automatic reply/i,
  /auto-reply/i,
  /away from (my )?desk/i,
  /on vacation/i,
  /on leave/i,
  /autoreply/i,
  /delivery.*fail/i,
  /undeliverable/i,
  /mail.*daemon/i,
  /postmaster@/i,
];

const FOLLOW_UP_KEYWORDS = [
  're:',
  'fw:',
  'fwd:',
  'supp',
  'supplement',
  'supplementary',
  'follow up',
  'followup',
  'follow-up',
  'update',
  'additional',
  'more info',
  'revised',
  'updated',
  'correction',
  'status',
  'enquiry',
  'query',
  'question',
];

function computeMessageHash(messageId: string | null | undefined): string | null {
  if (!messageId) return null;
  return crypto.createHash('sha256').update(messageId).digest('hex');
}

function isAutoReply(subject: string, content: string): boolean {
  const combined = `${subject} ${content}`;
  return AUTO_REPLY_PATTERNS.some(p => p.test(combined));
}

function isAuthorizedSender(sender: string, authorizedSenders: string[]): boolean {
  if (!authorizedSenders || authorizedSenders.length === 0) return true;
  const senderLower = sender.toLowerCase();
  for (const allowed of authorizedSenders) {
    const a = allowed.toLowerCase().trim();
    if (a === senderLower) return true;
    if (a.includes('@')) {
      const domain = a.split('@')[1];
      if (senderLower.endsWith('@' + domain)) return true;
    } else {
      if (senderLower.endsWith('@' + a)) return true;
    }
  }
  return false;
}

function isInsurerEnabled(sender: string, insurerOverride: Record<string, boolean>): boolean {
  if (!sender.includes('@')) return true;
  const domain = sender.split('@')[1].toLowerCase();
  for (const [key, enabled] of Object.entries(insurerOverride)) {
    const k = key.toLowerCase();
    if (domain === k || domain.endsWith('.' + k) || k.includes(domain)) return enabled;
  }
  return true;
}

async function isEmailProcessed(supabase: ReturnType<typeof createServerClient>, emailId: string): Promise<boolean> {
  const { data } = await supabase.from('cicop_processed_emails').select('id').eq('email_id', emailId).single();
  return !!data;
}

async function isMessageIdProcessed(supabase: ReturnType<typeof createServerClient>, messageIdHash: string | null): Promise<boolean> {
  if (!messageIdHash) return false;
  const { data } = await supabase.from('cicop_processed_emails').select('id').eq('message_id_hash', messageIdHash).limit(1);
  return Array.isArray(data) && data.length > 0;
}

async function isThreadProcessed(supabase: ReturnType<typeof createServerClient>, threadId: string | null): Promise<boolean> {
  if (!threadId) return false;
  const { data } = await supabase.from('cicop_processed_emails').select('id').eq('thread_id', threadId).limit(1);
  return Array.isArray(data) && data.length > 0;
}

async function isClaimRefProcessed(supabase: ReturnType<typeof createServerClient>, claimRef: string | null): Promise<boolean> {
  if (!claimRef || claimRef.startsWith('AUTO-')) return false;
  const { data } = await supabase.from('cicop_processed_emails').select('id').eq('claim_reference', claimRef).limit(1);
  return Array.isArray(data) && data.length > 0;
}

function formatReceivedDate(receivedAt: string | null | undefined): string {
  if (!receivedAt) return new Date().toLocaleDateString('en-AU', { dateStyle: 'long', timeStyle: 'short' });
  try {
    const d = new Date(receivedAt.replace('Z', '+00:00'));
    return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return new Date().toLocaleDateString('en-AU', { dateStyle: 'long', timeStyle: 'short' });
  }
}

async function markProcessed(
  supabase: ReturnType<typeof createServerClient>,
  payload: {
    email_id: string;
    sender: string;
    subject: string;
    message_id_hash?: string | null;
    thread_id?: string | null;
    claim_reference?: string | null;
    is_complaint?: boolean;
    is_follow_up?: boolean;
  }
): Promise<void> {
  await (supabase as any).from('cicop_processed_emails').insert({
    email_id: payload.email_id,
    sender: payload.sender,
    subject: payload.subject,
    message_id_hash: payload.message_id_hash ?? null,
    thread_id: payload.thread_id ?? null,
    claim_reference: payload.claim_reference ?? null,
    is_complaint: payload.is_complaint ?? false,
    is_follow_up: payload.is_follow_up ?? false,
  });
}

async function loadConfig(supabase: ReturnType<typeof createServerClient>): Promise<CICOPConfig> {
  const keys = ['email_to_monitor', 'authorized_senders', 'insurer_override', 'auto_reply_enabled', 'admin_alert_email'] as const;
  const rows: Record<string, { value?: unknown } | null> = {};
  for (const key of keys) {
    const { data } = await supabase.from('cicop_config').select('value').eq('key', key).single();
    rows[key] = data as { value?: unknown } | null;
  }
  return {
    email_to_monitor: (rows.email_to_monitor?.value as string) || 'info@crashify.com.au',
    authorized_senders: Array.isArray(rows.authorized_senders?.value) ? (rows.authorized_senders.value as string[]) : [],
    insurer_override: (rows.insurer_override?.value as Record<string, boolean>) || {},
    auto_reply_enabled: rows.auto_reply_enabled?.value !== false,
    admin_alert_email: (typeof rows.admin_alert_email?.value === 'string' ? rows.admin_alert_email.value : null) || 'info@crashify.com.au',
  };
}

export class CICOPEmailIntegration {
  private emailToMonitor = 'info@crashify.com.au';
  private checkIntervalMinutes = 5;

  async pollEmails(): Promise<ProcessedEmailResult[]> {
    const results: ProcessedEmailResult[] = [];
    try {
      const supabase = createServerClient();
      const config = await loadConfig(supabase);
      const { accessToken } = await getMicrosoftGraphToken();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const monitorEmail = config.email_to_monitor || this.emailToMonitor;
      const url = `https://graph.microsoft.com/v1.0/users/${monitorEmail}/messages?$filter=receivedDateTime ge ${oneHourAgo}&$top=50&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,body,bodyPreview,conversationId,internetMessageId,isRead,hasAttachments`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`Failed to fetch emails: ${response.statusText}`);
      const data = await response.json();
      const emails = data.value || [];
      console.log(`📧 Fetched ${emails.length} recent emails`);

      for (const email of emails) {
        const result = await this.processEmail(email, config, supabase);
        results.push(result);
      }
      return results;
    } catch (error: any) {
      console.error('❌ Error polling emails:', error);
      throw error;
    }
  }

  private async processEmail(
    emailData: any,
    config: CICOPConfig,
    supabase: ReturnType<typeof createServerClient>
  ): Promise<ProcessedEmailResult> {
    const emailId = emailData.id;
    const result: ProcessedEmailResult = {
      email_id: emailId,
      processed: false,
      sla_started: false,
      complaint_detected: false,
      auto_response_sent: false,
    };

    const sender = (emailData.from?.emailAddress?.address || 'unknown').toLowerCase();
    const displayName = emailData.from?.emailAddress?.name || null;
    const subject = emailData.subject || '(no subject)';
    const content = emailData.bodyPreview || (emailData.body?.content ?? '');
    const receivedAt = emailData.receivedDateTime;
    const conversationId = emailData.conversationId || null;
    const internetMessageId = emailData.internetMessageId || null;
    const hasAttachments = Boolean(emailData.hasAttachments);

    const emailToMonitor = config.email_to_monitor.toLowerCase();

    try {
      // ————— CRITICAL: Skip self-emails (prevents infinite loops) —————
      if (sender === emailToMonitor) {
        console.log('⏭️  SKIPPING: Email from monitoring address (self-email)');
        await markProcessed(supabase, {
          email_id: emailId,
          sender,
          subject,
          message_id_hash: computeMessageHash(internetMessageId),
          thread_id: conversationId,
        });
        result.processed = true;
        return result;
      }

      // ————— Should process? (dedup: already_processed, message_id, thread, auto_reply) —————
      const alreadyProcessed = await isEmailProcessed(supabase, emailId);
      if (alreadyProcessed) {
        console.log(`⏭️  Email ${emailId} already processed`);
        result.processed = true;
        return result;
      }

      const messageIdHash = computeMessageHash(internetMessageId);
      if (messageIdHash && (await isMessageIdProcessed(supabase, messageIdHash))) {
        console.log('⏭️  Duplicate message_id – skip');
        result.processed = true;
        return result;
      }
      if (conversationId && (await isThreadProcessed(supabase, conversationId))) {
        console.log('⏭️  Duplicate thread – skip');
        result.processed = true;
        return result;
      }
      if (isAutoReply(subject, content)) {
        console.log('⏭️  Auto-reply detected – skip');
        await markProcessed(supabase, {
          email_id: emailId,
          sender,
          subject,
          message_id_hash: messageIdHash,
          thread_id: conversationId,
        });
        result.processed = true;
        return result;
      }

      // ————— AI Analysis (used for claim_ref, vehicle_rego, etc.) —————
      const analysis = await cicopAIService.analyzeEmail({ subject, sender, content });
      const claimRef = analysis.claim_reference || null;
      const vehicleRego = analysis.vehicle_rego ?? null;
      const hasRealClaimRef = claimRef && !claimRef.startsWith('AUTO-');
      const hasVehicleRego = vehicleRego && !['Not provided', 'None', ''].includes(String(vehicleRego));

      // ————— Priority 1: Complaint —————
      const complaintDetection = await cicopAIService.detectComplaint({ subject, content });
      if (complaintDetection !== null) {
        console.log(`🚨 COMPLAINT DETECTED – ${complaintDetection.severity}`);
        const complaintData = {
          complaint_type: complaintDetection.complaint_type,
          severity: complaintDetection.severity,
          confidence: complaintDetection.confidence,
          claim_reference: claimRef,
          vehicle_rego: vehicleRego,
          sender,
          subject,
          detected_at: new Date().toISOString(),
        };
        await (supabase as any).from('cicop_complaints').insert({
          claim_reference: claimRef,
          vehicle_rego: vehicleRego,
          sender,
          subject,
          complaint_type: complaintData.complaint_type,
          severity: complaintData.severity,
          metadata: complaintData,
        });
        result.complaint_detected = true;

        const shouldSendComplaintAck = hasRealClaimRef || hasVehicleRego;
        if (shouldSendComplaintAck) {
          const complaintAckSent = await this.sendComplaintAck(sender, displayName, content, claimRef || 'COMPLAINT-PENDING', complaintData, receivedAt, config.email_to_monitor, supabase);
          result.complaint_ack_sent = complaintAckSent;
        }
        await this.sendComplaintAlert(complaintData, config.admin_alert_email, config.email_to_monitor, supabase);
        await markProcessed(supabase, {
          email_id: emailId,
          sender,
          subject,
          message_id_hash: messageIdHash,
          thread_id: conversationId,
          claim_reference: claimRef,
          is_complaint: true,
        });
        result.processed = true;
        return result;
      }

      // ————— Priority 1.5: Regulatory (audit only) —————
      const regulatory = cicopAIService.detectRegulatoryQuestion({ subject, content });
      if (regulatory) {
        console.log(`⚖️ Regulatory question detected: ${regulatory.keywords.join(', ')}`);
        await (supabase as any).from('cicop_audit_log').insert({
          event_type: 'regulatory_detected',
          action: 'regulatory_question_flagged',
          claim_reference: claimRef,
          details: { sender, keywords: regulatory.keywords, subject },
          success: true,
        });
      }

      // ————— Priority 1.6: Repairer submission —————
      const repairerData = cicopAIService.detectRepairerSubmission({
        subject,
        content,
        sender,
        hasAttachments,
      });
      if (repairerData && (hasRealClaimRef || hasVehicleRego)) {
        const repClaimRef = claimRef || `REPAIRER-${emailId.slice(0, 8)}`;
        console.log(`🔧 REPAIRER SUBMISSION – ${repairerData.submission_type}`);
        const repAckSent = await this.sendRepairerAck(sender, repClaimRef, repairerData, receivedAt, config.email_to_monitor, supabase);
        result.repairer_ack_sent = repAckSent;
        await markProcessed(supabase, {
          email_id: emailId,
          sender,
          subject,
          message_id_hash: messageIdHash,
          thread_id: conversationId,
          claim_reference: repClaimRef,
        });
        result.processed = true;
        return result;
      }
      if (repairerData && !hasRealClaimRef && !hasVehicleRego) {
        console.log('⏭️  Repairer submission lacks claim/rego – skip ack');
        await markProcessed(supabase, {
          email_id: emailId,
          sender,
          subject,
          message_id_hash: messageIdHash,
          thread_id: conversationId,
          claim_reference: claimRef || `REPAIRER-${emailId.slice(0, 8)}`,
        });
        result.processed = true;
        return result;
      }

      // ————— Priority 2: Follow-up —————
      const subjectLower = subject.toLowerCase();
      const hasFollowUpKeywords = FOLLOW_UP_KEYWORDS.some(kw => subjectLower.includes(kw));
      const isFollowUpDb = claimRef ? await isClaimRefProcessed(supabase, claimRef) : false;
      const isFollowUp = hasFollowUpKeywords || isFollowUpDb;

      if (isFollowUp) {
        console.log(`🔄 FOLLOW-UP detected: ${claimRef}`);
        if (!claimRef || claimRef.startsWith('AUTO-')) {
          await markProcessed(supabase, {
            email_id: emailId,
            sender,
            subject,
            message_id_hash: messageIdHash,
            thread_id: conversationId,
            claim_reference: null,
            is_follow_up: true,
          });
          result.processed = true;
          return result;
        }
        const intent = await cicopAIService.classifyFollowUp({ content }, claimRef);
        const draft = this.generateFollowUpDraft(claimRef, intent, subject);
        await (supabase as any).from('cicop_follow_up_drafts').insert({
          claim_reference: claimRef,
          draft_type: intent,
          subject: draft.subject,
          body: draft.body,
          used: false,
        });
        await markProcessed(supabase, {
          email_id: emailId,
          sender,
          subject,
          message_id_hash: messageIdHash,
          thread_id: conversationId,
          claim_reference: claimRef,
          is_follow_up: true,
        });
        result.follow_up_handled = true;
        result.processed = true;
        return result;
      }

      // ————— Priority 3: New job (authorized senders only) —————
      if (!isAuthorizedSender(sender, config.authorized_senders)) {
        console.log(`⏭️  Unauthorized sender for new job: ${sender}`);
        await markProcessed(supabase, {
          email_id: emailId,
          sender,
          subject,
          message_id_hash: messageIdHash,
          thread_id: conversationId,
        });
        result.skipped_unauthorized = true;
        result.processed = true;
        return result;
      }
      if (!isInsurerEnabled(sender, config.insurer_override)) {
        console.log(`⏭️  Insurer disabled: ${sender}`);
        await markProcessed(supabase, {
          email_id: emailId,
          sender,
          subject,
          message_id_hash: messageIdHash,
          thread_id: conversationId,
        });
        result.processed = true;
        return result;
      }

      if (!hasRealClaimRef && !hasVehicleRego) {
        console.log('⏭️  No valid claim ref and no vehicle rego – skip');
        await markProcessed(supabase, {
          email_id: emailId,
          sender,
          subject,
          message_id_hash: messageIdHash,
          thread_id: conversationId,
          claim_reference: claimRef,
        });
        result.processed = true;
        return result;
      }

      const finalClaimRef = claimRef || `AUTO-${emailId.slice(0, 8)}`;
      if (await isClaimRefProcessed(supabase, finalClaimRef)) {
        console.log(`⏭️  Claim ref ${finalClaimRef} already processed`);
        await markProcessed(supabase, {
          email_id: emailId,
          sender,
          subject,
          message_id_hash: messageIdHash,
          thread_id: conversationId,
          claim_reference: finalClaimRef,
        });
        result.processed = true;
        return result;
      }

      if (!config.auto_reply_enabled) {
        console.log('⏸️  Auto-reply disabled globally');
        await markProcessed(supabase, {
          email_id: emailId,
          sender,
          subject,
          message_id_hash: messageIdHash,
          thread_id: conversationId,
          claim_reference: finalClaimRef,
        });
        result.processed = true;
        return result;
      }

      const slaResult = await cicopSlaService.startSlaTracking(finalClaimRef, sender, analysis.urgency);
      result.sla_started = true;

      const ackSent = await this.sendAutoResponse(
        emailId,
        sender,
        subject,
        analysis,
        {
          displayName,
          content,
          commitmentText: slaResult.commitment_text,
          receivedAt,
        },
        config.email_to_monitor,
        supabase
      );
      result.auto_response_sent = ackSent;

      await markProcessed(supabase, {
        email_id: emailId,
        sender,
        subject,
        message_id_hash: messageIdHash,
        thread_id: conversationId,
        claim_reference: finalClaimRef,
      });
      result.processed = true;
      return result;
    } catch (error: any) {
      console.error(`❌ Error processing email ${emailId}:`, error);
      result.error = error.message;
      return result;
    }
  }

  private generateFollowUpDraft(claimRef: string, intent: string, originalSubject: string): { subject: string; body: string } {
    const subject = `RE: ${originalSubject}`;
    let body = '[DRAFT - REVIEW BEFORE SENDING]\n\nDear Team,\n\nThank you for your email regarding ' + claimRef + '.\n\n[INSERT RESPONSE HERE]\n\nKind regards,\nCrashify Assessment Team';
    if (intent === 'info_request') {
      body =
        '[DRAFT - REVIEW BEFORE SENDING]\n\nDear Team,\n\nThank you for your enquiry regarding ' +
        claimRef +
        '.\n\n[INSERT STATUS UPDATE HERE]\n\nCurrent Status: [Under Review / In Progress / Completed]\nExpected Completion: [DATE/TIME]\n\nKind regards,\nCrashify Assessment Team';
    } else if (intent === 'additional_info') {
      body =
        '[DRAFT - REVIEW BEFORE SENDING]\n\nDear Team,\n\nThank you for providing additional information for ' +
        claimRef +
        '.\n\nWe have received your [photos/documents/details] and these will be reviewed by our assessment team.\n\nKind regards,\nCrashify Assessment Team';
    }
    return { subject, body };
  }

  private async sendAutoResponse(
    _emailId: string,
    recipient: string,
    _originalSubject: string,
    analysis: any,
    options: {
      displayName?: string | null;
      content?: string;
      commitmentText?: string;
      receivedAt?: string | null;
    },
    fromEmail: string,
    supabase: ReturnType<typeof createServerClient>
  ): Promise<boolean> {
    try {
      const { data: templateRow } = await supabase
        .from('cicop_email_templates')
        .select('subject_template, body_template')
        .eq('template_name', 'default_acknowledgment')
        .single();
      const template = templateRow as { subject_template?: string; body_template?: string } | null;
      if (!template?.subject_template || !template?.body_template) {
        console.error('❌ No default_acknowledgment template');
        return false;
      }
      const customerName = getGreetingRecipient(recipient, options.displayName ?? null, options.content ?? null);
      const commitmentText =
        options.commitmentText ??
        'Your assessment will be completed within our standard 48-hour service level from instruction receipt.';
      const variables: Record<string, string> = {
        claim_reference: analysis.claim_reference || 'TBC',
        customer_name: customerName,
        vehicle_details: analysis.vehicle_rego ? `Rego: ${analysis.vehicle_rego}` : 'Details to be confirmed',
        date_received: formatReceivedDate(options.receivedAt),
        assessment_type: 'Desktop/On-site',
        status: 'Received',
        commitment_text: commitmentText,
      };
      let subject = template.subject_template;
      let body = template.body_template;
      Object.entries(variables).forEach(([key, value]) => {
        subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
        body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
      const { accessToken } = await getMicrosoftGraphToken();
      const fromAddr = fromEmail || this.emailToMonitor;
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(fromAddr)}/sendMail`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: {
              subject,
              body: { contentType: 'Text', content: body },
              toRecipients: [{ emailAddress: { address: recipient } }],
            },
          }),
        }
      );
      if (!res.ok) throw new Error(`Send failed: ${res.statusText}`);
      console.log(`✅ Auto-response sent to ${recipient}`);
      await (supabase as any).from('cicop_audit_log').insert({
        event_type: 'auto_response',
        action: 'email_sent',
        details: { recipient, claim_reference: analysis.claim_reference, template: 'default_acknowledgment' },
        success: true,
      });
      return true;
    } catch (error) {
      console.error('Error sending auto-response:', error);
      return false;
    }
  }

  private async sendComplaintAck(
    to: string,
    displayName: string | null,
    content: string,
    claimRef: string,
    complaintData: { complaint_type?: string | null; severity?: string | null; vehicle_rego?: string | null; detected_at?: string },
    receivedAt: string | null | undefined,
    fromEmail: string,
    supabase: ReturnType<typeof createServerClient>
  ): Promise<boolean> {
    try {
      const { data: row } = await supabase
        .from('cicop_email_templates')
        .select('subject_template, body_template')
        .eq('template_name', 'complaint_acknowledgment')
        .single();
      const t = row as { subject_template?: string; body_template?: string } | null;
      const greeting = getGreeting(to, displayName, content);
      const customerName = getGreetingRecipient(to, displayName, content);
      const variables: Record<string, string> = {
        claim_reference: claimRef,
        customer_name: customerName,
        date_received: formatReceivedDate(receivedAt),
        vehicle_details: complaintData.vehicle_rego ? String(complaintData.vehicle_rego) : '',
      };
      if (!t?.subject_template || !t?.body_template) {
        const subject = `URGENT: Complaint Acknowledgment - ${claimRef}`;
        const body =
          `${greeting},\n\nCOMPLAINT ACKNOWLEDGMENT\n\nWe have received your complaint regarding reference: ${claimRef}.\n\nReceived: ${formatReceivedDate(receivedAt)}\n\nA senior member of our team will contact you within 2 business hours.\n\nKind regards,\nCrashify Complaints Management Team`;
        const ok = await this.sendRawEmail(to, subject, body, fromEmail, supabase);
        if (ok) {
          await (supabase as any).from('cicop_audit_log').insert({
            event_type: 'complaint_acknowledgment',
            action: 'email_sent',
            details: { recipient: to, claim_reference: claimRef },
            success: true,
          });
        }
        return ok;
      }
      let subject = t.subject_template;
      let body = t.body_template;
      Object.entries(variables).forEach(([key, value]) => {
        subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
        body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
      const ok = await this.sendRawEmail(to, subject, body, fromEmail, supabase);
      if (ok) {
        await (supabase as any).from('cicop_audit_log').insert({
          event_type: 'complaint_acknowledgment',
          action: 'email_sent',
          details: { recipient: to, claim_reference: claimRef },
          success: true,
        });
      }
      return ok;
    } catch (error) {
      console.error('Error sending complaint ack:', error);
      return false;
    }
  }

  private async sendRepairerAck(
    to: string,
    claimRef: string,
    repairerData: { submission_type: string },
    receivedAt: string | null | undefined,
    fromEmail: string,
    supabase: ReturnType<typeof createServerClient>
  ): Promise<boolean> {
    try {
      const { data: row } = await supabase
        .from('cicop_email_templates')
        .select('subject_template, body_template')
        .eq('template_name', 'repairer_acknowledgment')
        .single();
      const t = row as { subject_template?: string; body_template?: string } | null;
      const submissionType = repairerData.submission_type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
      const variables: Record<string, string> = {
        claim_reference: claimRef,
        customer_name: 'Team',
        submission_type: submissionType,
        date_received: formatReceivedDate(receivedAt),
      };
      if (!t?.subject_template || !t?.body_template) {
        const subject = `Received: ${submissionType} - ${claimRef}`;
        const body =
          `Dear Team,\n\nThank you for your submission regarding ${claimRef}.\n\nSUBMISSION DETAILS\nReference: ${claimRef}\nType: ${submissionType}\nReceived: ${formatReceivedDate(receivedAt)}\n\nKind regards,\nCrashify Assessment Team`;
        return this.sendRawEmail(to, subject, body, fromEmail, supabase);
      }
      let subject = t.subject_template;
      let body = t.body_template;
      Object.entries(variables).forEach(([key, value]) => {
        subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
        body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
      return this.sendRawEmail(to, subject, body, fromEmail, supabase);
    } catch (error) {
      console.error('Error sending repairer ack:', error);
      return false;
    }
  }

  private async sendComplaintAlert(
    complaintData: { complaint_type?: string | null; severity?: string | null; sender?: string; subject?: string; claim_reference?: string | null; vehicle_rego?: string | null; detected_at?: string; confidence?: number; method?: string },
    adminEmail: string,
    fromEmail: string,
    supabase: ReturnType<typeof createServerClient>
  ): Promise<boolean> {
    const subject = `COMPLAINT ALERT: ${(complaintData.complaint_type || 'complaint').toUpperCase()}`;
    const body = `COMPLAINT DETECTED - IMMEDIATE ACTION REQUIRED\n\nSeverity: ${complaintData.severity || 'N/A'}\nType: ${complaintData.complaint_type || 'N/A'}\n\nSender: ${complaintData.sender}\nSubject: ${complaintData.subject}\nClaim: ${complaintData.claim_reference ?? 'N/A'}\nRego: ${complaintData.vehicle_rego ?? 'N/A'}\n\nReview and respond within 2 hours.`;
    return this.sendRawEmail(adminEmail, subject, body, fromEmail, supabase);
  }

  private async sendRawEmail(
    to: string,
    subject: string,
    body: string,
    fromEmail: string,
    _supabase: ReturnType<typeof createServerClient>
  ): Promise<boolean> {
    try {
      const { accessToken } = await getMicrosoftGraphToken();
      const fromAddr = fromEmail || this.emailToMonitor;
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(fromAddr)}/sendMail`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: {
              subject,
              body: { contentType: 'Text', content: body },
              toRecipients: [{ emailAddress: { address: to } }],
            },
          }),
        }
      );
      if (!res.ok) throw new Error(`Send failed: ${res.statusText}`);
      console.log(`✅ Email sent to ${to}: ${subject.slice(0, 40)}...`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async generateResponseDraft(emailData: {
    sender: string;
    subject: string;
    content: string;
    displayName?: string;
  }): Promise<{ subject: string; body: string }> {
    const supabase = createServerClient();
    const analysis = await cicopAIService.analyzeEmail(emailData);
    const { data: templateRow } = await supabase
      .from('cicop_email_templates')
      .select('subject_template, body_template')
      .eq('template_name', 'default_acknowledgment')
      .single();
    const template = templateRow as { subject_template?: string; body_template?: string } | null;
    if (!template?.subject_template || !template?.body_template) throw new Error('Template not found');
    const customerName = getGreetingRecipient(
      emailData.sender,
      emailData.displayName ?? null,
      emailData.content ?? null
    );
    const variables: Record<string, string> = {
      claim_reference: analysis.claim_reference || 'TBC',
      customer_name: customerName,
      vehicle_details: analysis.vehicle_rego ? `Rego: ${analysis.vehicle_rego}` : 'Details to be confirmed',
      date_received: new Date().toLocaleDateString(),
      assessment_type: 'Desktop/On-site',
      status: 'Received',
      commitment_text: 'Your assessment will be completed within our standard 48-hour service level from instruction receipt.',
    };
    let subject = template.subject_template;
    let body = template.body_template;
    Object.entries(variables).forEach(([key, value]) => {
      subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return { subject, body };
  }
}

export const cicopEmailIntegration = new CICOPEmailIntegration();
