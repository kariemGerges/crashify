import { NextRequest, NextResponse } from 'next/server';
import { getMicrosoftGraphToken } from '@/server/services/microsoft-graph-auth';

/**
 * POST /api/cicop/emails/send-response
 * Send email response via Microsoft Graph
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, body: emailBody } = body;

    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      );
    }

    // Get access token
    const { accessToken } = await getMicrosoftGraphToken();

    // Send email via Microsoft Graph
    const response = await fetch(
      'https://graph.microsoft.com/v1.0/users/info@crashify.com.au/sendMail',
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
              content: emailBody
            },
            toRecipients: [
              {
                emailAddress: {
                  address: to
                }
              }
            ]
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send email: ${error}`);
    }

    console.log(`✅ Email sent to ${to}`);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
