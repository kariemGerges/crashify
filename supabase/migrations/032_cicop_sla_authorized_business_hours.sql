-- ============================================================================
-- CICOP: Add commitment_text, authorized_senders, business_hours, insurer_sla
-- ============================================================================

-- Add commitment_text to SLA tracking (per-insurer commitment text)
ALTER TABLE cicop_sla_tracking
ADD COLUMN IF NOT EXISTS commitment_text TEXT;

COMMENT ON COLUMN cicop_sla_tracking.commitment_text IS 'Exact commitment text sent to insurer (legally binding)';

-- Insert CICOP config keys for authorized senders, business hours, and per-insurer SLA
INSERT INTO cicop_config (key, value, description)
VALUES 
  (
    'authorized_senders',
    '["joanna@p2pcover.com.au", "mat@p2pcover.com.au", "claims@p2pcover.com.au", "kayla@p2pcover.com.au", "claims@carpeesh.com"]'::jsonb,
    'Email addresses or domains (e.g. p2pcover.com.au) that are allowed to trigger auto-response. Only emails from these senders are processed.'
  ),
  (
    'business_hours',
    '{"enabled": false, "timezone": "Australia/Melbourne", "days": [1, 2, 3, 4, 5], "start_hour": 9, "end_hour": 17}'::jsonb,
    'Business hours for SLA calculation. days: 1=Mon..5=Fri. When enabled, SLA deadline only counts hours within these windows.'
  ),
  (
    'insurer_sla',
    '{
      "p2pcover.com.au": {"sla_hours": 48, "business_hours_only": false, "commitment_text": "A member of our leadership team will contact you within the next 48 hours."},
      "carpeesh.com": {"sla_hours": 24, "business_hours_only": false, "commitment_text": "A member of our leadership team will contact you within the next 24 hours."}
    }'::jsonb,
    'Per-insurer SLA: key = domain (e.g. p2pcover.com.au). Each value: sla_hours, business_hours_only, commitment_text.'
  )
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description;

-- Update default email template to use {{commitment_text}} and {{greeting}}
-- Template variables: claim_reference, customer_name (or greeting), vehicle_details, date_received, assessment_type, status, commitment_text
UPDATE cicop_email_templates
SET 
  body_template = 'Dear {{customer_name}},

Thank you for engaging Crashify for your vehicle assessment requirements.

ASSESSMENT DETAILS
Reference: {{claim_reference}}
Vehicle: {{vehicle_details}}
Received: {{date_received}}
Assessment Type: {{assessment_type}}
Status: {{status}}

SERVICE COMMITMENT
{{commitment_text}}

Best regards,
Crashify Assessment Team',
  variables = '{"claim_reference": "string", "customer_name": "string", "vehicle_details": "string", "date_received": "string", "assessment_type": "string", "status": "string", "commitment_text": "string"}'::jsonb
WHERE template_name = 'default_acknowledgment';
