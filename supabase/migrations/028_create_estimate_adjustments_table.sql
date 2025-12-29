-- =============================================
-- Migration: Create estimate_adjustments table
-- Tracks all changes to estimate line items for audit trail
-- =============================================

CREATE TABLE IF NOT EXISTS estimate_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('labor', 'parts', 'sublet', 'misc')),
    item_index INTEGER, -- Index in the JSONB array
    item_id TEXT, -- Optional unique identifier for the item
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
    old_value JSONB,
    new_value JSONB,
    adjusted_by UUID REFERENCES users(id),
    adjusted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    comment TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_estimate_adjustments_assessment ON estimate_adjustments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_estimate_adjustments_adjusted_at ON estimate_adjustments(adjusted_at DESC);
CREATE INDEX IF NOT EXISTS idx_estimate_adjustments_adjusted_by ON estimate_adjustments(adjusted_by);
CREATE INDEX IF NOT EXISTS idx_estimate_adjustments_item_type ON estimate_adjustments(item_type);

-- Add comments for documentation
COMMENT ON TABLE estimate_adjustments IS 'Audit trail of all changes to estimate line items (labor, parts, sublet, misc)';
COMMENT ON COLUMN estimate_adjustments.item_type IS 'Type of item: labor, parts, sublet, or misc';
COMMENT ON COLUMN estimate_adjustments.item_index IS 'Index position in the JSONB array';
COMMENT ON COLUMN estimate_adjustments.action IS 'Action performed: created, updated, or deleted';
COMMENT ON COLUMN estimate_adjustments.old_value IS 'Previous value before change (for updates/deletes)';
COMMENT ON COLUMN estimate_adjustments.new_value IS 'New value after change (for creates/updates)';

-- Enable RLS
ALTER TABLE estimate_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view adjustments for assessments they have access to
-- Based on role-based access (same as assessments table)
CREATE POLICY "Users can view estimate adjustments for accessible assessments"
    ON estimate_adjustments
    FOR SELECT
    USING (
        -- Admin, super_admin, reviewer, and manager can see all adjustments
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'admin', 'reviewer', 'manager', 'assessor')
        )
        -- Assessment must exist and not be deleted
        AND EXISTS (
            SELECT 1 FROM assessments
            WHERE assessments.id = estimate_adjustments.assessment_id
            AND assessments.deleted_at IS NULL
        )
    );

-- RLS Policy: Only authenticated users with appropriate roles can insert adjustments
CREATE POLICY "Authenticated users can create estimate adjustments"
    ON estimate_adjustments
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND users.role IN ('super_admin', 'admin', 'assessor', 'manager', 'reviewer')
            )
        )
    );

-- RLS Policy: Only the user who created the adjustment or admins can update
CREATE POLICY "Users can update their own estimate adjustments"
    ON estimate_adjustments
    FOR UPDATE
    USING (
        adjusted_by = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'admin')
        )
    );

