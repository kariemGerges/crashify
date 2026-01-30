import { NextRequest, NextResponse } from 'next/server';
import { cicopEmailIntegration } from '@/server/services/cicop-email-integration';

/**
 * POST /api/cicop/emails/generate-response
 * Generate draft response for an email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sender, subject, content } = body;

    if (!sender || !subject || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const draft = await cicopEmailIntegration.generateResponseDraft({
      sender,
      subject,
      content
    });

    return NextResponse.json(draft);

  } catch (error: any) {
    console.error('Error generating response:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
