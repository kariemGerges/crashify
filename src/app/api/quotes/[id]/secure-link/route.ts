// =============================================
// FILE: app/api/quotes/[id]/secure-link/route.ts
// POST: Generate secure form link after payment
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { randomBytes } from 'crypto';
import type { Database } from '@/server/lib/types/database.types';

type SecureFormLinkInsert = Database['public']['Tables']['secure_form_links']['Insert'];

export const runtime = 'nodejs';

// POST: Generate secure form link
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createServerClient();
        const { id: quoteRequestId } = await params;

        // Verify quote request exists and payment received
        const { data: quoteRequest, error: fetchError } = await supabase
            .from('quote_requests')
            .select('*')
            .eq('id', quoteRequestId)
            .single();

        if (fetchError || !quoteRequest) {
            return NextResponse.json(
                { error: 'Quote request not found' },
                { status: 404 }
            );
        }

        if (quoteRequest.status !== 'payment_received') {
            return NextResponse.json(
                { error: 'Payment not received yet' },
                { status: 400 }
            );
        }

        // Check if secure link already exists and is valid
        const { data: existingLink } = await supabase
            .from('secure_form_links')
            .select('*')
            .eq('quote_request_id', quoteRequestId)
            .eq('is_used', false)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (existingLink) {
            const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            return NextResponse.json({
                success: true,
                secureLink: `${origin}/pages/(minimal)/claims?access=${existingLink.token}`,
            });
        }

        // Generate secure token
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

        // Create secure form link
        const linkData: SecureFormLinkInsert = {
            token,
            quote_request_id: quoteRequestId,
            expires_at: expiresAt.toISOString(),
            is_used: false,
            metadata: {
                created_at: new Date().toISOString(),
            },
        };

        const { data: secureLink, error: insertError } = await (
            supabase.from('secure_form_links') as unknown as {
                insert: (values: SecureFormLinkInsert[]) => {
                    select: () => {
                        single: () => Promise<{
                            data: { token: string } | null;
                            error: { message: string } | null;
                        }>;
                    };
                };
            }
        )
            .insert([linkData])
            .select()
            .single();

        if (insertError || !secureLink) {
            return NextResponse.json(
                {
                    error: 'Failed to create secure link',
                    details: insertError?.message || 'Unknown error',
                },
                { status: 500 }
            );
        }

        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        return NextResponse.json({
            success: true,
            secureLink: `${origin}/pages/(minimal)/claims?access=${secureLink.token}`,
        });
    } catch (error) {
        console.error('[SECURE_LINK] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate secure link',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

