# Database Migration Guide

## Overview

This guide explains the database schema updates needed for the complete automation system.

## New Tables

### 1. `email_logs`
Tracks all emails sent by the system (repairer, insurance, client emails).

**Key Fields:**
- `assessment_id` - Links to assessment
- `recipient_type` - repairer, insurer, client, or admin
- `recipient_email` - Email address
- `subject`, `body_html`, `body_text` - Email content
- `attachments` - JSON array of attachment filenames
- `status` - sent, failed, bounced, delivered, opened
- `message_id` - Email provider message ID

### 2. `quote_requests`
Stores quote requests from one-off clients.

**Key Fields:**
- `name`, `email`, `phone` - Client contact info
- `vehicle`, `description` - Request details
- `status` - pending_review, approved, rejected, payment_received, expired
- `spam_score` - 0-100 spam detection score
- `payment_id` - Stripe payment intent ID
- `recommended_service`, `recommended_price` - Admin recommendations

### 3. `secure_form_links`
Secure token-based links for form access after payment.

**Key Fields:**
- `token` - Unique secure token
- `quote_request_id` - Links to quote request
- `expires_at` - Expiration timestamp
- `is_used` - Whether link has been used
- `used_at`, `used_by_ip` - Usage tracking

### 4. `repairers` (Optional)
Directory of repairers for quick reference.

**Key Fields:**
- `name`, `email`, `phone`, `address` - Contact info
- `abn` - Australian Business Number
- `is_trusted` - Preferred repairer flag

### 5. `clients` (Optional)
Directory of insurance company clients.

**Key Fields:**
- `company_name`, `contact_email` - Company info
- `domain` - Email domain for auto-detection
- `portal_token` - Token for portal access
- `portal_enabled` - Whether portal is enabled

## New Fields on `assessments` Table

### IQ Controls Integration
- `entered_iq_at` - Timestamp when entered into IQ Controls
- `entered_by` - User ID who entered it
- `iq_controls_reference` - Reference ID from IQ Controls

### Source Tracking
- `source` - web_form, email, phone, or portal
- `email_id` - Email UID if imported from email

### Payment Integration
- `payment_id` - Stripe payment intent ID

### Completion Tracking
- `completed_at` - Timestamp when assessment was completed

## Migration Steps

1. **Backup your database** (always!)

2. **Run migrations in order:**
   ```bash
   # Via Supabase Dashboard SQL Editor (recommended)
   # Copy/paste each migration file in order
   ```

3. **Verify migrations:**
   ```sql
   -- Check new columns exist
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'assessments' 
   AND column_name IN ('entered_iq_at', 'source', 'email_id', 'payment_id');
   
   -- Check new tables exist
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('email_logs', 'quote_requests', 'secure_form_links');
   ```

4. **Update TypeScript types:**
   After running migrations, regenerate your database types:
   ```bash
   # If using Supabase CLI
   supabase gen types typescript --local > src/server/lib/types/database.types.ts
   ```

## Impact on Existing Code

### Assessments
- Existing assessments will have `source = 'web_form'` by default
- New assessments from email will have `source = 'email'`
- IQ Helper will populate `entered_iq_at`, `entered_by`, `iq_controls_reference`

### Email Automation
- All sent emails will be logged in `email_logs` table
- Can track delivery status and opens

### Quote Requests
- New workflow for one-off clients
- Payment integration via `payment_id`

## Testing

After migrations:

1. **Test IQ Helper:**
   - Mark an assessment as entered in IQ Controls
   - Verify `entered_iq_at`, `entered_by`, `iq_controls_reference` are populated

2. **Test Email Automation:**
   - Send an email via Email Automation
   - Check `email_logs` table for entry

3. **Test Email Processing:**
   - Process an email
   - Verify assessment has `source = 'email'` and `email_id` populated

## Rollback Plan

If you need to rollback:

```sql
-- Remove new columns (be careful - this will lose data!)
ALTER TABLE assessments
DROP COLUMN IF EXISTS entered_iq_at,
DROP COLUMN IF EXISTS entered_by,
DROP COLUMN IF EXISTS iq_controls_reference,
DROP COLUMN IF EXISTS source,
DROP COLUMN IF EXISTS email_id,
DROP COLUMN IF EXISTS payment_id,
DROP COLUMN IF EXISTS completed_at;

-- Drop new tables (be careful - this will lose data!)
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS secure_form_links CASCADE;
DROP TABLE IF EXISTS quote_requests CASCADE;
DROP TABLE IF EXISTS repairers CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
```

## Next Steps

After migrations are complete:

1. Update TypeScript types
2. Test all new features
3. Update admin dashboard to show new fields
4. Configure email logging in Email Automation
5. Set up quote request workflow

