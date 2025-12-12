// =============================================
// FILE: app/api/email/process/route.ts
// POST: Process unread emails from info@crashify.com.au
// This can be called manually or via cron job
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { EmailProcessor } from '@/server/lib/services/email-processor';
import { validateAndExtractIp } from '@/server/lib/utils/security';
import { getSession } from '@/server/lib/auth/session';

export const runtime = 'nodejs';

// POST: Process unread emails
export async function POST(request: NextRequest) {
    try {
        // API Authentication: Accept either Bearer token OR authenticated admin user
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.EMAIL_PROCESSOR_TOKEN;

        let isAuthorized = false;

        // Check for Bearer token authentication (for cron jobs/external calls)
        if (expectedToken && authHeader === `Bearer ${expectedToken}`) {
            isAuthorized = true;
        } else {
            // Check for authenticated admin user (for frontend calls)
            const user = await getSession();
            if (user && ['admin', 'super_admin'].includes(user.role)) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return NextResponse.json(
                {
                    error: 'Unauthorized. Bearer token or admin authentication required.',
                },
                { status: 401 }
            );
        }

        // Note: Email IMAP authentication uses IMAP_PASSWORD
        // The password should be set in your .env.local file as IMAP_PASSWORD
        // For GoDaddy legacy email: Use your regular email password
        // For GoDaddy Microsoft 365: Use outlook.office365.com and an app password (if MFA enabled)
        // For Outlook/Office 365: You MUST use an app-specific password, not your regular password
        // Default IMAP settings:
        //   - GoDaddy legacy: imap.secureserver.net:993
        //   - Microsoft 365: outlook.office365.com:993
        //   - Outlook.com: imap-mail.outlook.com:993

        console.log('[EMAIL_PROCESS] Starting email processing...');

        const processor = new EmailProcessor();
        const result = await processor.processUnreadEmails();

        console.log('[EMAIL_PROCESS] Processing complete:', {
            processed: result.processed,
            created: result.created,
            errors: result.errors.length,
        });

        return NextResponse.json({
            success: result.success,
            processed: result.processed,
            created: result.created,
            errors: result.errors,
            message: `Processed ${result.processed} emails, created ${result.created} assessments`,
        });
    } catch (error) {
        console.error('[EMAIL_PROCESS] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to process emails',
                details:
                    error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// GET: Check email processing status (health check)
export async function GET() {
    const imapHost = process.env.IMAP_HOST || 'imap.secureserver.net';
    const imapUser = process.env.IMAP_USER || 'info@crashify.com.au';
    const imapPort = process.env.IMAP_PORT || '993';
    const imapPassword = process.env.IMAP_PASSWORD || '';

    // Diagnostic information (without exposing password)
    const passwordInfo = imapPassword
        ? {
              configured: true,
              length: imapPassword.length,
              hasSpaces: imapPassword.includes(' '),
              startsWithQuote:
                  imapPassword.startsWith('"') || imapPassword.startsWith("'"),
              endsWithQuote:
                  imapPassword.endsWith('"') || imapPassword.endsWith("'"),
              trimmedLength: imapPassword.trim().length,
          }
        : {
              configured: false,
          };

    // Check for common configuration issues
    const issues: string[] = [];
    const warnings: string[] = [];

    if (!imapPassword) {
        issues.push('IMAP_PASSWORD is not set');
    } else {
        if (imapPassword.trim() !== imapPassword) {
            warnings.push(
                'Password has leading/trailing spaces - this may cause authentication to fail'
            );
        }
        if (imapPassword.startsWith('"') || imapPassword.startsWith("'")) {
            warnings.push(
                'Password starts with quotes - remove quotes from .env.local'
            );
        }
        if (imapPassword.endsWith('"') || imapPassword.endsWith("'")) {
            warnings.push(
                'Password ends with quotes - remove quotes from .env.local'
            );
        }
        if (imapPassword.length < 8) {
            warnings.push('Password seems too short (less than 8 characters)');
        }
    }

    if (!imapUser.includes('@')) {
        issues.push('IMAP_USER should be a full email address');
    }

    if (
        imapHost.includes('map.secureserver.net') &&
        !imapHost.includes('imap.secureserver.net')
    ) {
        issues.push(
            'IMAP_HOST appears to have a typo (should be "imap.secureserver.net", not "map.secureserver.net")'
        );
    }

    return NextResponse.json({
        status: issues.length === 0 ? 'ok' : 'configuration_issues',
        message: 'Email processor configuration check',
        config: {
            imapHost,
            imapUser,
            imapPort,
            passwordInfo,
        },
        diagnostics: {
            issues,
            warnings,
            recommendations: [
                'For GoDaddy legacy email: Use your regular email password',
                'For GoDaddy Microsoft 365: Set IMAP_HOST=outlook.office365.com and use an app password if MFA is enabled',
                'For Microsoft 365: You need an app password from https://account.microsoft.com/security',
                'Verify IMAP is enabled in your email account settings',
                'Test your password by logging into webmail at https://productivity.godaddy.com',
            ],
        },
    });
}
