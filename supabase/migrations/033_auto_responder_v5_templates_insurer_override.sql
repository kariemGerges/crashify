-- ============================================================================
-- Auto-Responder v5: complaint_acknowledgment, repairer_acknowledgment, insurer_override
-- ============================================================================

-- Complaint acknowledgment template (v5.1: send when complaint has claim/rego)
INSERT INTO cicop_email_templates (template_name, insurer_domain, template_type, subject_template, body_template, variables)
VALUES (
  'complaint_acknowledgment',
  NULL,
  'complaint_acknowledgment',
  'URGENT: Complaint Acknowledgment - {{claim_reference}}',
  'Dear {{customer_name}},

COMPLAINT ACKNOWLEDGMENT

We have received your complaint regarding reference: {{claim_reference}}

Received: {{date_received}}
Vehicle: {{vehicle_details}}

Your concerns are being treated as a priority matter. A senior member of our team will contact you within 2 business hours to discuss and address your feedback.

We take all customer feedback seriously and are committed to resolving this matter promptly and to your satisfaction.

ESCALATION CONTACT
If you require immediate assistance, please contact:
Direct: 0426 000 910
Phone: 1300 655 106
Email: info@crashify.com.au

Kind regards,

Crashify Complaints Management Team
Crashify Pty Ltd | ABN: 82 676 363 116
Professional Vehicle Assessment Services
www.crashify.com.au

---
This is an automated acknowledgment of your complaint. A senior team member will contact you within 2 business hours.',
  '{"claim_reference": "string", "customer_name": "string", "date_received": "string", "vehicle_details": "string"}'::jsonb
)
ON CONFLICT (template_name) DO UPDATE SET
  subject_template = EXCLUDED.subject_template,
  body_template = EXCLUDED.body_template,
  variables = EXCLUDED.variables;

-- Repairer acknowledgment template (v5.1: supplementary quote/images)
INSERT INTO cicop_email_templates (template_name, insurer_domain, template_type, subject_template, body_template, variables)
VALUES (
  'repairer_acknowledgment',
  NULL,
  'repairer_acknowledgment',
  'Received: {{submission_type}} - {{claim_reference}}',
  'Dear {{customer_name}},

Thank you for your submission regarding {{claim_reference}}.

SUBMISSION DETAILS
Reference: {{claim_reference}}
Type: {{submission_type}}
Received: {{date_received}}

Your {{submission_type}} has been received and will be reviewed by our assessment team. We will contact you if any clarification or additional information is required.

If you have any questions, please reference the above claim number in your correspondence.

CONTACT INFORMATION
Phone: 1300 655 106
Email: info@crashify.com.au

Kind regards,

Crashify Assessment Team
Crashify Pty Ltd | ABN: 82 676 363 116
Professional Vehicle Assessment Services
www.crashify.com.au

---
This is an automated acknowledgment. All information provided is handled in accordance with the Privacy Act 1988 (Cth).
For our Privacy Policy, visit: https://www.crashify.com.au/pages/privacy',
  '{"claim_reference": "string", "customer_name": "string", "submission_type": "string", "date_received": "string"}'::jsonb
)
ON CONFLICT (template_name) DO UPDATE SET
  subject_template = EXCLUDED.subject_template,
  body_template = EXCLUDED.body_template,
  variables = EXCLUDED.variables;

-- insurer_override: per-domain enable/disable for auto-reply (v5)
INSERT INTO cicop_config (key, value, description)
VALUES (
  'insurer_override',
  '{"p2pcover.com.au": true, "carpeesh.com": true}'::jsonb,
  'Per-insurer auto-reply enabled. Key = domain. true = process new job intakes from this domain.'
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description;

-- admin_alert_email for complaint/SLA alerts
INSERT INTO cicop_config (key, value, description)
VALUES (
  'admin_alert_email',
  '"info@crashify.com.au"'::jsonb,
  'Email address for complaint and SLA breach alerts.'
)
ON CONFLICT (key) DO NOTHING;

-- email_to_monitor (mailbox to poll and send from)
INSERT INTO cicop_config (key, value, description)
VALUES (
  'email_to_monitor',
  '"info@crashify.com.au"'::jsonb,
  'Microsoft 365 mailbox to monitor and send auto-responses from.'
)
ON CONFLICT (key) DO NOTHING;
