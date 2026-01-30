/**
 * CICOP Email Integration Service
 *
 * Handles:
 * - Microsoft 365 email polling
 * - Authorized senders filter (only process configured senders/domains)
 * - Email analysis (AI)
 * - Business-hours SLA + per-insurer commitment text
 * - Complaint detection
 * - Compliance-safe name extraction for greeting
 * - Auto-response generation
 */

import { createServerClient } from '@/server/lib/supabase/client';
import { cicopAIService } from './cicop-ai-service';
import { cicopSlaService } from './cicop-sla-service';
import { getGreetingRecipient } from './name-extractor';
import { getMicrosoftGraphToken } from './microsoft-graph-auth';

interface ProcessedEmailResult {
  email_id: string;
  processed: boolean;
  sla_started: boolean;
  complaint_detected: boolean;
  auto_response_sent: boolean;
  skipped_unauthorized?: boolean;
  error?: string;
}

/** Check if sender is in allowed list (exact email or domain match). Empty list = allow all. */
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

export class CICOPEmailIntegration {
  private emailToMonitor = 'info@crashify.com.au';
  private checkIntervalMinutes = 5;

  /**
   * Poll emails from Microsoft 365
   */
  async pollEmails(): Promise<ProcessedEmailResult[]> {
    const results: ProcessedEmailResult[] = [];

    try {
      // Get access token
      const { accessToken } = await getMicrosoftGraphToken();

      // Fetch recent emails (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/users/${this.emailToMonitor}/messages?$filter=receivedDateTime ge ${oneHourAgo}&$top=50&$orderby=receivedDateTime desc`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch emails: ${response.statusText}`);
      }

      const data = await response.json();
      const emails = data.value || [];

      console.log(`📧 Fetched ${emails.length} recent emails`);

      const supabase = createServerClient();
      const { data: authData } = await supabase
        .from('cicop_config')
        .select('value')
        .eq('key', 'authorized_senders')
        .single() as { data: { value?: unknown } | null };
      const authorizedSenders: string[] = Array.isArray(authData?.value)
        ? (authData.value as string[])
        : [];

      for (const email of emails) {
        const result = await this.processEmail(email, authorizedSenders);
        results.push(result);
      }

      return results;

    } catch (error: any) {
      console.error('❌ Error polling emails:', error);
      throw error;
    }
  }

  /**
   * Process a single email
   */
  private async processEmail(
    emailData: any,
    authorizedSenders: string[]
  ): Promise<ProcessedEmailResult> {
    const emailId = emailData.id;
    const result: ProcessedEmailResult = {
      email_id: emailId,
      processed: false,
      sla_started: false,
      complaint_detected: false,
      auto_response_sent: false
    };

    try {
      const supabase = createServerClient();

      const sender = emailData.from?.emailAddress?.address || 'unknown';
      const displayName = emailData.from?.emailAddress?.name || null;
      const subject = emailData.subject || '(no subject)';
      const content = emailData.bodyPreview || emailData.body?.content || '';

      if (!isAuthorizedSender(sender, authorizedSenders)) {
        console.log(`⏭️  Skipping email from unauthorized sender: ${sender}`);
        result.skipped_unauthorized = true;
        return result;
      }

      const { data: existing } = await supabase
        .from('cicop_processed_emails')
        .select('id')
        .eq('email_id', emailId)
        .single();

      if (existing) {
        console.log(`⏭️  Email ${emailId} already processed`);
        result.processed = true;
        return result;
      }

      // AI Analysis
      const analysis = await cicopAIService.analyzeEmail({
        subject,
        sender,
        content
      });

      console.log(`🤖 Analyzed email from ${sender}:`, analysis);

      // Check for complaint
      const complaintDetection = await cicopAIService.detectComplaint({
        subject,
        content
      });

      const isComplaint = complaintDetection !== null;

      // Mark as processed (cicop_processed_emails may be missing from DB types)
      // @ts-expect-error - table may be missing from generated types
      await supabase.from('cicop_processed_emails').insert({
        email_id: emailId,
        sender,
        subject,
        is_complaint: isComplaint,
        is_follow_up: false
      });

      let commitmentText: string | undefined;
      if (analysis.claim_reference && !isComplaint) {
        const slaResult = await cicopSlaService.startSlaTracking(
          analysis.claim_reference,
          sender,
          analysis.urgency
        );
        commitmentText = slaResult.commitment_text;
        result.sla_started = true;
      }

      // Log complaint if detected (cicop_complaints may be missing from DB types)
      if (isComplaint && complaintDetection) {
        // @ts-expect-error - table may be missing from generated types
        await supabase.from('cicop_complaints').insert({
          claim_reference: analysis.claim_reference,
          vehicle_rego: analysis.vehicle_rego,
          sender,
          subject,
          complaint_type: complaintDetection.complaint_type,
          severity: complaintDetection.severity
        });
        result.complaint_detected = true;
        console.log(`⚠️  Complaint detected: ${complaintDetection.severity} severity`);
      }

      if (!isComplaint) {
        const autoResponseSent = await this.sendAutoResponse(
          emailId,
          sender,
          subject,
          analysis,
          { displayName, content, commitmentText }
        );
        result.auto_response_sent = autoResponseSent;
      }

      result.processed = true;
      return result;

    } catch (error: any) {
      console.error(`❌ Error processing email ${emailId}:`, error);
      result.error = error.message;
      return result;
    }
  }

  /**
   * Send auto-response (compliance-safe greeting + per-insurer commitment text)
   */
  private async sendAutoResponse(
    emailId: string,
    recipient: string,
    originalSubject: string,
    analysis: any,
    options: {
      displayName?: string | null;
      content?: string;
      commitmentText?: string;
    } = {}
  ): Promise<boolean> {
    try {
      const supabase = createServerClient();

      // Check if auto-reply is enabled (cicop_config may be missing from DB types)
      const { data: configRow } = await supabase
        .from('cicop_config')
        .select('value')
        .eq('key', 'auto_reply_enabled')
        .single();
      const config = configRow as { value?: boolean } | null;

      if (!config || config.value === false) {
        console.log('⏭️  Auto-reply disabled');
        return false;
      }

      // Get email template (cicop_email_templates may be missing from DB types)
      const { data: templateRow } = await supabase
        .from('cicop_email_templates')
        .select('subject_template, body_template, variables')
        .eq('template_name', 'default_acknowledgment')
        .single();
      const template = templateRow as { subject_template?: string; body_template?: string; variables?: unknown } | null;

      if (!template || !template.subject_template || !template.body_template) {
        console.error('❌ No email template found');
        return false;
      }

      const customerName = getGreetingRecipient(
        recipient,
        options.displayName ?? null,
        options.content ?? null
      );
      const commitmentText =
        options.commitmentText ??
        'Your assessment will be completed within our standard 48-hour service level from instruction receipt.';

      const variables: Record<string, string> = {
        claim_reference: analysis.claim_reference || 'TBC',
        customer_name: customerName,
        vehicle_details: analysis.vehicle_rego ? `Rego: ${analysis.vehicle_rego}` : 'Details to be confirmed',
        date_received: new Date().toLocaleDateString(),
        assessment_type: 'Desktop/On-site',
        status: 'Received',
        commitment_text: commitmentText
      };

      let subject = template.subject_template;
      let body = template.body_template;

      // Replace variables
      Object.entries(variables).forEach(([key, value]) => {
        subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
        body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      // Send via Microsoft Graph API
      const { accessToken } = await getMicrosoftGraphToken();

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/users/${this.emailToMonitor}/sendMail`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: {
              subject,
              body: {
                contentType: 'Text',
                content: body
              },
              toRecipients: [
                {
                  emailAddress: {
                    address: recipient
                  }
                }
              ]
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.statusText}`);
      }

      console.log(`✅ Auto-response sent to ${recipient}`);

      // Log to audit
      // @ts-expect-error - table may be missing from generated types
      await supabase.from('cicop_audit_log').insert({
        event_type: 'auto_response',
        action: 'email_sent',
        details: {
          recipient,
          claim_reference: analysis.claim_reference,
          template: 'default_acknowledgment'
        },
        success: true
      });

      return true;

    } catch (error) {
      console.error('Error sending auto-response:', error);
      return false;
    }
  }

  /**
   * Generate response draft for manual review
   */
  async generateResponseDraft(emailData: {
    sender: string;
    subject: string;
    content: string;
  }): Promise<{ subject: string; body: string }> {
    try {
      const supabase = createServerClient();

      // Analyze email first
      const analysis = await cicopAIService.analyzeEmail(emailData);

      // Get template (cicop_email_templates may be missing from DB types)
      const { data: templateRow } = await supabase
        .from('cicop_email_templates')
        .select('subject_template, body_template')
        .eq('template_name', 'default_acknowledgment')
        .single();
      const template = templateRow as { subject_template?: string; body_template?: string } | null;

      if (!template || !template.subject_template || !template.body_template) {
        throw new Error('Template not found');
      }

      const customerName = getGreetingRecipient(
        emailData.sender,
        (emailData as { displayName?: string }).displayName ?? null,
        emailData.content ?? null
      );
      const variables: Record<string, string> = {
        claim_reference: analysis.claim_reference || 'TBC',
        customer_name: customerName,
        vehicle_details: analysis.vehicle_rego ? `Rego: ${analysis.vehicle_rego}` : 'Details to be confirmed',
        date_received: new Date().toLocaleDateString(),
        assessment_type: 'Desktop/On-site',
        status: 'Received',
        commitment_text:
          'Your assessment will be completed within our standard 48-hour service level from instruction receipt.'
      };

      let subject = template.subject_template;
      let body = template.body_template;

      Object.entries(variables).forEach(([key, value]) => {
        subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
        body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      return { subject, body };
    } catch (error) {
      console.error('Error generating draft:', error);
      throw error;
    }
  }
}

// Export singleton
export const cicopEmailIntegration = new CICOPEmailIntegration();
