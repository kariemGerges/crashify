/**
 * CICOP Email Integration Service
 * 
 * Handles:
 * - Microsoft 365 email polling
 * - Email analysis (AI)
 * - SLA tracking
 * - Complaint detection
 * - Auto-response generation
 */

import { createServerClient } from '@/server/lib/supabase/client';
import { cicopAIService } from './cicop-ai-service';
import { getMicrosoftGraphToken } from './microsoft-graph-auth';

interface ProcessedEmailResult {
  email_id: string;
  processed: boolean;
  sla_started: boolean;
  complaint_detected: boolean;
  auto_response_sent: boolean;
  error?: string;
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

      // Process each email
      for (const email of emails) {
        const result = await this.processEmail(email);
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
  private async processEmail(emailData: any): Promise<ProcessedEmailResult> {
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

      // Check if already processed
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

      // Extract email details
      const sender = emailData.from?.emailAddress?.address || 'unknown';
      const subject = emailData.subject || '(no subject)';
      const content = emailData.bodyPreview || emailData.body?.content || '';

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

      // Start SLA tracking if needed
      if (analysis.claim_reference && !isComplaint) {
        await this.startSLATracking(analysis.claim_reference, sender, analysis.urgency);
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

      // Send auto-response if enabled and not a complaint
      if (!isComplaint) {
        const autoResponseSent = await this.sendAutoResponse(
          emailId,
          sender,
          subject,
          analysis
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
   * Start SLA tracking for a claim
   */
  private async startSLATracking(
    claimReference: string,
    sender: string,
    urgency: string
  ): Promise<void> {
    try {
      const supabase = createServerClient();

      // Check if SLA already exists
      const { data: existing } = await supabase
        .from('cicop_sla_tracking')
        .select('id')
        .eq('claim_reference', claimReference)
        .single();

      if (existing) {
        console.log(`⏭️  SLA already tracking for ${claimReference}`);
        return;
      }

      // Get insurer domain
      const insurerDomain = sender.includes('@') ? sender.split('@')[1] : 'unknown';

      // Default SLA: 48 hours
      const slaHours = urgency === 'urgent' ? 24 : 48;
      const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

      // @ts-expect-error - table may be missing from generated types
      await supabase.from('cicop_sla_tracking').insert({
        claim_reference: claimReference,
        sender,
        insurer_domain: insurerDomain,
        urgency,
        sla_deadline: slaDeadline.toISOString(),
        sla_hours: slaHours,
        status: 'in_progress'
      });

      console.log(`⏰ SLA started for ${claimReference}: ${slaHours}h deadline`);

    } catch (error) {
      console.error('Error starting SLA tracking:', error);
    }
  }

  /**
   * Send auto-response
   */
  private async sendAutoResponse(
    emailId: string,
    recipient: string,
    originalSubject: string,
    analysis: any
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

      // Render template with variables
      const variables = {
        claim_reference: analysis.claim_reference || 'TBC',
        vehicle_details: analysis.vehicle_rego ? `Rego: ${analysis.vehicle_rego}` : 'Details to be confirmed',
        date_received: new Date().toLocaleDateString(),
        assessment_type: 'Desktop/On-site',
        status: 'Received',
        greeting: 'Dear Customer'
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

      // Render with variables
      const variables = {
        claim_reference: analysis.claim_reference || 'TBC',
        vehicle_details: analysis.vehicle_rego ? `Rego: ${analysis.vehicle_rego}` : 'Details to be confirmed',
        date_received: new Date().toLocaleDateString(),
        assessment_type: 'Desktop/On-site',
        status: 'Received',
        greeting: 'Dear Customer'
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
