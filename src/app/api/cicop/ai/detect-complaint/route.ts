import { NextRequest, NextResponse } from 'next/server';
import { cicopAIService } from '@/server/services/cicop-ai-service';

/**
 * POST /api/cicop/ai/detect-complaint
 * Detect if email is a complaint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, content } = body;

    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, content' },
        { status: 400 }
      );
    }

    const detection = await cicopAIService.detectComplaint({
      subject,
      content
    });

    if (!detection) {
      return NextResponse.json({
        is_complaint: false,
        complaint_type: null,
        severity: null,
        confidence: 0,
        method: 'rules'
      });
    }

    return NextResponse.json(detection);

  } catch (error: any) {
    console.error('Error in detect-complaint API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
