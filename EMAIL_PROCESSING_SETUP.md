# Email Processing Setup Guide

## Overview

The Email Processing Engine automatically monitors `intake@crashify.com.au` and creates assessments from incoming emails.

## Features

- ✅ Monitors IMAP inbox for unread emails
- ✅ Extracts data from email body (claim #, vehicle, insured, incident)
- ✅ Extracts repairer info from PDF attachments
- ✅ Downloads and saves photo attachments
- ✅ Duplicate detection (prevents duplicate assessments)
- ✅ Auto-creates assessment records
- ✅ Marks emails as read after processing

## Setup

### 1. Environment Variables

Add these to your `.env` file:

```env
# IMAP Configuration
IMAP_HOST=imap.outlook.com
IMAP_USER=intake@crashify.com.au
IMAP_PASSWORD=your_email_password_here
IMAP_PORT=993

# Optional: Security token for API endpoint
EMAIL_PROCESSOR_TOKEN=your_secure_random_token_here
```

### 2. Database Status Field

The system creates assessments with status `pending` and adds a note in `internal_notes` indicating they came from email.

### 3. Running the Email Processor

#### Option A: Manual Trigger (API Call)

```bash
# Without authentication token
curl -X POST http://localhost:3000/api/email/process

# With authentication token
curl -X POST http://localhost:3000/api/email/process \
  -H "Authorization: Bearer your_secure_random_token_here"
```

#### Option B: Cron Job (Recommended)

Set up a cron job to run every 1-5 minutes:

```bash
# Add to crontab (crontab -e)
*/5 * * * * curl -X POST https://your-domain.com/api/email/process -H "Authorization: Bearer your_secure_random_token_here"
```

#### Option C: Vercel Cron (if deployed on Vercel)

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/email/process",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

And add the authorization header check in the API route.

### 4. Testing

1. Send a test email to `intake@crashify.com.au` with:
   - Subject: "Assessment Request - Toyota Camry ABC123"
   - Body containing:
     ```
     Claim: PCL0004876-002
     Vehicle: 2021 Toyota Camry Hybrid ABC123
     Insured: John Smith
     Incident: Rear-ended at intersection
     ```
   - Attach some photos

2. Call the API endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/email/process
   ```

3. Check the admin dashboard - a new assessment should appear with status "pending"

## Email Format

The system extracts data using pattern matching. For best results, include:

```
Claim: [CLAIM_NUMBER]
Vehicle: [YEAR] [MAKE] [MODEL] [REGISTRATION]
Insured: [NAME]
Incident: [DESCRIPTION]
```

## PDF Processing

If the email contains a PDF attachment (e.g., repairer quote), the system will:
- Extract repairer company name
- Extract repairer email
- Extract repairer phone
- Extract repairer address

This data is stored in the assessment's `internal_notes` for manual review.

## Duplicate Detection

The system checks for duplicates based on:
- Claim reference (if provided)
- Vehicle registration (if provided)
- Created within last 24 hours

If a duplicate is found, the email is skipped.

## Troubleshooting

### Emails not processing

1. Check IMAP credentials are correct
2. Check email account has unread emails
3. Check server logs for errors
4. Verify IMAP port (993 for TLS)

### Data not extracted correctly

- Ensure email body follows the expected format
- Check that claim numbers and vehicle info are clearly labeled
- PDF extraction works best with standard repairer quote formats

### Photos not saving

- Check Supabase Storage bucket `Assessment-photos` exists
- Verify storage permissions
- Check file size limits

## Security

- Always use the `EMAIL_PROCESSOR_TOKEN` in production
- Store IMAP password securely (use environment variables)
- Consider using OAuth2 for email access instead of password

## Monitoring

Check processing status:

```bash
curl http://localhost:3000/api/email/process
```

Returns:
```json
{
  "status": "ok",
  "message": "Email processor is ready",
  "config": {
    "imapHost": "imap.outlook.com",
    "imapUser": "intake@crashify.com.au",
    "imapPort": "993"
  }
}
```

## Next Steps

After emails are processed:
1. Review imported assessments in admin dashboard
2. Complete missing fields manually
3. Use IQ Helper to copy data to IQ Controls
4. Complete assessment and send reports

