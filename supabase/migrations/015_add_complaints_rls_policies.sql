-- =============================================
-- Migration: Add RLS policies for complaints tables
-- REQ-56 to REQ-79: Complaint System Security
-- =============================================

-- Enable RLS on complaints tables
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_attachments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies for complaints
-- =============================================

-- Policy: Super admins, admins, reviewers, and managers can access all complaints
CREATE POLICY "staff_access_complaints"
ON complaints FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'admin', 'reviewer', 'manager')
    )
);

-- Policy: Read-only users can view complaints (read-only)
CREATE POLICY "read_only_view_complaints"
ON complaints FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'read_only'
    )
);

-- =============================================
-- RLS Policies for complaint_messages
-- =============================================

-- Policy: Staff can access messages for complaints they can access
CREATE POLICY "staff_access_complaint_messages"
ON complaint_messages FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM complaints
        WHERE complaints.id = complaint_messages.complaint_id
        AND (
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND users.role IN ('super_admin', 'admin', 'reviewer', 'manager')
            )
        )
    )
);

-- Policy: Read-only users can view messages
CREATE POLICY "read_only_view_complaint_messages"
ON complaint_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM complaints
        WHERE complaints.id = complaint_messages.complaint_id
        AND (
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND users.role = 'read_only'
            )
        )
    )
);

-- =============================================
-- RLS Policies for complaint_attachments
-- =============================================

-- Policy: Staff can access attachments for complaints they can access
CREATE POLICY "staff_access_complaint_attachments"
ON complaint_attachments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM complaints
        WHERE complaints.id = complaint_attachments.complaint_id
        AND (
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND users.role IN ('super_admin', 'admin', 'reviewer', 'manager')
            )
        )
    )
);

-- Policy: Read-only users can view attachments
CREATE POLICY "read_only_view_complaint_attachments"
ON complaint_attachments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM complaints
        WHERE complaints.id = complaint_attachments.complaint_id
        AND (
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND users.role = 'read_only'
            )
        )
    )
);

