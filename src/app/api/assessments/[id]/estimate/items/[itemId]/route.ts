// =============================================
// FILE: app/api/assessments/[id]/estimate/items/[itemId]/route.ts
// PATCH: Update an estimate item
// DELETE: Delete an estimate item
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { getSession } from '@/server/lib/auth/session';
import type { Database } from '@/server/lib/types/database.types';
import type { LaborItem, PartItem, SubletItem, MiscItem } from '@/server/lib/types/pdf-report.types';

type AssessmentRow = Database['public']['Tables']['assessments']['Row'];
type Json = Database['public']['Tables']['assessments']['Row']['labor_items'];

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// PATCH: Update an estimate item
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; itemId: string }> }
) {
    try {
        const user = await getSession();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, itemId } = await params;
        const body = await request.json();
        const { itemType, item } = body as {
            itemType: 'labor' | 'parts' | 'sublet' | 'misc';
            item: LaborItem | PartItem | SubletItem | MiscItem;
        };

        if (!itemType || !item) {
            return NextResponse.json(
                { error: 'itemType and item are required' },
                { status: 400 }
            );
        }

        // Parse itemId to get index (format: "labor_0", "parts_1", etc.)
        const parts = itemId.split('_');
        if (parts.length !== 2) {
            return NextResponse.json(
                { error: 'Invalid itemId format' },
                { status: 400 }
            );
        }

        const itemIndex = parseInt(parts[1], 10);
        if (isNaN(itemIndex)) {
            return NextResponse.json(
                { error: 'Invalid item index' },
                { status: 400 }
            );
        }

        const supabase = createServerClient();

        // Get current assessment
        const { data: assessment, error: fetchError } = await supabase
            .from('assessments')
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (fetchError || !assessment) {
            return NextResponse.json(
                { error: 'Assessment not found' },
                { status: 404 }
            );
        }

        const typedAssessment = assessment as AssessmentRow;

        // Get current items array
        const fieldName = `${itemType}_items` as 'labor_items' | 'parts_items' | 'sublet_items' | 'misc_items';
        const currentItems = (typedAssessment[fieldName] as Json) || [];

        if (!Array.isArray(currentItems) || itemIndex >= currentItems.length) {
            return NextResponse.json(
                { error: 'Item not found' },
                { status: 404 }
            );
        }

        // Store old value for audit
        const oldValue = currentItems[itemIndex];

        // Update item
        const updatedItems = [...currentItems];
        updatedItems[itemIndex] = item as unknown as Json;

        // Update assessment
        const updateData = {
            [fieldName]: updatedItems as Json,
        };

        const { error: updateError } = await (
            supabase.from('assessments') as unknown as {
                update: (values: Record<string, unknown>) => {
                    eq: (column: string, value: string) => Promise<{
                        error: { message: string } | null;
                    }>;
                };
            }
        )
            .update(updateData)
            .eq('id', id);

        if (updateError) {
            return NextResponse.json(
                {
                    error: 'Failed to update estimate item',
                    details: updateError.message,
                },
                { status: 500 }
            );
        }

        // Log adjustment
        await (
            supabase.from('estimate_adjustments') as unknown as {
                insert: (values: Record<string, unknown>) => Promise<{
                    error: { message: string } | null;
                }>;
            }
        ).insert({
            assessment_id: id,
            item_type: itemType,
            item_index: itemIndex,
            action: 'updated',
            old_value: oldValue as unknown as Json,
            new_value: item as unknown as Json,
            adjusted_by: user.id,
            comment: 'Item updated via estimate editor',
        });

        return NextResponse.json({
            success: true,
            message: 'Estimate item updated successfully',
        });
    } catch (error) {
        console.error('[ESTIMATE_ITEMS] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to update estimate item',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// DELETE: Delete an estimate item
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; itemId: string }> }
) {
    try {
        const user = await getSession();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, itemId } = await params;
        const searchParams = request.nextUrl.searchParams;
        const itemType = searchParams.get('itemType') as 'labor' | 'parts' | 'sublet' | 'misc' | null;

        if (!itemType) {
            return NextResponse.json(
                { error: 'itemType query parameter is required' },
                { status: 400 }
            );
        }

        // Parse itemId to get index
        const parts = itemId.split('_');
        if (parts.length !== 2) {
            return NextResponse.json(
                { error: 'Invalid itemId format' },
                { status: 400 }
            );
        }

        const itemIndex = parseInt(parts[1], 10);
        if (isNaN(itemIndex)) {
            return NextResponse.json(
                { error: 'Invalid item index' },
                { status: 400 }
            );
        }

        const supabase = createServerClient();

        // Get current assessment
        const { data: assessment, error: fetchError } = await supabase
            .from('assessments')
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (fetchError || !assessment) {
            return NextResponse.json(
                { error: 'Assessment not found' },
                { status: 404 }
            );
        }

        const typedAssessment = assessment as AssessmentRow;

        // Get current items array
        const fieldName = `${itemType}_items` as 'labor_items' | 'parts_items' | 'sublet_items' | 'misc_items';
        const currentItems = (typedAssessment[fieldName] as Json) || [];

        if (!Array.isArray(currentItems) || itemIndex >= currentItems.length) {
            return NextResponse.json(
                { error: 'Item not found' },
                { status: 404 }
            );
        }

        // Store old value for audit
        const oldValue = currentItems[itemIndex];

        // Remove item
        const updatedItems = currentItems.filter((_, index) => index !== itemIndex);

        // Update assessment
        const updateData = {
            [fieldName]: updatedItems as Json,
        };

        const { error: updateError } = await (
            supabase.from('assessments') as unknown as {
                update: (values: Record<string, unknown>) => {
                    eq: (column: string, value: string) => Promise<{
                        error: { message: string } | null;
                    }>;
                };
            }
        )
            .update(updateData)
            .eq('id', id);

        if (updateError) {
            return NextResponse.json(
                {
                    error: 'Failed to delete estimate item',
                    details: updateError.message,
                },
                { status: 500 }
            );
        }

        // Log adjustment
        await (
            supabase.from('estimate_adjustments') as unknown as {
                insert: (values: Record<string, unknown>) => Promise<{
                    error: { message: string } | null;
                }>;
            }
        ).insert({
            assessment_id: id,
            item_type: itemType,
            item_index: itemIndex,
            action: 'deleted',
            old_value: oldValue as unknown as Json,
            adjusted_by: user.id,
            comment: 'Item deleted via estimate editor',
        });

        return NextResponse.json({
            success: true,
            message: 'Estimate item deleted successfully',
        });
    } catch (error) {
        console.error('[ESTIMATE_ITEMS] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete estimate item',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

