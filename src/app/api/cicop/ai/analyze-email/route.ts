import { NextRequest, NextResponse } from 'next/server';
import { cicopAIService } from '@/server/services/cicop-ai-service';

/**
 * POST /api/cicop/ai/analyze-email
 * Analyze email content using AI or fallback rules
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, sender, content } = body;

    if (!subject || !sender || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, sender, content' },
        { status: 400 }
      );
    }

    const analysis = await cicopAIService.analyzeEmail({
      subject,
      sender,
      content
    });

    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error('Error in analyze-email API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
