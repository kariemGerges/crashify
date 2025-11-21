import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/server/lib/auth/session';
import { EmailService } from '@/server/lib/services/email-service';

export async function POST(request: NextRequest) {
    try {
        // Check if user is authenticated and is admin
        const currentUser = await getSession();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        if (currentUser.role !== 'admin') {
            return NextResponse.json(
                { error: 'Insufficient permissions. Admin role required.' },
                { status: 403 }
            );
        }

        const { email, userName, qrCode, secret, otpauthUrl } =
            await request.json();

        if (!email || !userName || !qrCode || !secret || !otpauthUrl) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Send email
        const result = await EmailService.sendTwoFactorSetup({
            to: email,
            userName,
            qrCodeDataUrl: qrCode,
            secret,
            otpauthUrl,
        });

        if (!result.success) {
            return NextResponse.json(
                { error: 'Failed to send email' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            messageId: result.messageId,
        });
    } catch (error) {
        console.error('Error sending 2FA setup email:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

