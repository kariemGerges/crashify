-- =============================================
-- Migration: Create email_processing table
-- Enterprise-level email processing tracking
-- =============================================

DROP TABLE IF EXISTS email_processing CASCADE;

CREATE TABLE IF NOT EXISTS email_processing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Email identification
    email_provider_id TEXT NOT NULL, -- Graph API ID or IMAP UID
    email_provider_type TEXT NOT NULL CHECK (email_provider_type IN ('microsoft_graph', 'imap')),
    folder_name TEXT, -- Folder name if folder-based processing (e.g., 'Crashify Assessments')
    
    -- Email metadata
    email_from TEXT NOT NULL,
    email_from_name TEXT,
    email_to TEXT,
    email_subject TEXT,
    email_received_at TIMESTAMPTZ,
    email_message_id TEXT, -- Internet Message ID
    email_has_attachments BOOLEAN DEFAULT false,
    email_attachments_count INTEGER DEFAULT 0,
    
    -- Processing information
    processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (
        processing_status IN (
            'pending',
            'processing',
            'completed',
            'failed',
            'skipped',
            'duplicate',
            'quarantined',
            'filtered'
        )
    ),
    processing_method TEXT CHECK (processing_method IN ('graph_api', 'imap')),
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    processing_duration_ms INTEGER, -- Processing duration in milliseconds
    
    -- Assessment creation
    assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
    assessment_created BOOLEAN DEFAULT false,
    
    -- Error tracking
    error_message TEXT,
    error_type TEXT, -- e.g., 'validation_error', 'database_error', 'parsing_error'
    error_stack TEXT, -- Stack trace for debugging (truncated)
    retry_count INTEGER DEFAULT 0,
    retry_after TIMESTAMPTZ, -- When to retry if failed
    
    -- Spam detection
    spam_score INTEGER CHECK (spam_score >= 0 AND spam_score <= 100),
    spam_flags TEXT[] DEFAULT '{}',
    is_spam BOOLEAN DEFAULT false,
    is_whitelisted BOOLEAN DEFAULT false,
    is_blacklisted BOOLEAN DEFAULT false,
    
    -- Data extraction results
    extracted_data JSONB DEFAULT '{}'::jsonb, -- Extracted claim reference, vehicle info, etc.
    extraction_confidence DECIMAL(3, 2) CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1),
    
    -- Raw email data (for debugging and reprocessing)
    raw_email_data JSONB, -- Full email metadata (sanitized)
    email_body_preview TEXT, -- First 500 chars of email body
    
    -- Processing context
    request_id TEXT, -- Request ID from API call
    processed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- User who triggered processing
    processing_batch_id UUID, -- Group related email processing runs
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ, -- Soft delete
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT email_processing_unique_provider_id UNIQUE (email_provider_id, email_provider_type)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_processing_status ON email_processing(processing_status);
CREATE INDEX IF NOT EXISTS idx_email_processing_email_from ON email_processing(email_from);
CREATE INDEX IF NOT EXISTS idx_email_processing_email_provider_id ON email_processing(email_provider_id);
CREATE INDEX IF NOT EXISTS idx_email_processing_assessment_id ON email_processing(assessment_id);
CREATE INDEX IF NOT EXISTS idx_email_processing_created_at ON email_processing(created_at);
CREATE INDEX IF NOT EXISTS idx_email_processing_processing_started_at ON email_processing(processing_started_at);
CREATE INDEX IF NOT EXISTS idx_email_processing_processing_completed_at ON email_processing(processing_completed_at);
CREATE INDEX IF NOT EXISTS idx_email_processing_request_id ON email_processing(request_id);
CREATE INDEX IF NOT EXISTS idx_email_processing_batch_id ON email_processing(processing_batch_id);
CREATE INDEX IF NOT EXISTS idx_email_processing_processed_by_user_id ON email_processing(processed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_email_processing_spam_score ON email_processing(spam_score);
CREATE INDEX IF NOT EXISTS idx_email_processing_is_spam ON email_processing(is_spam);
CREATE INDEX IF NOT EXISTS idx_email_processing_retry_count ON email_processing(retry_count);
CREATE INDEX IF NOT EXISTS idx_email_processing_retry_after ON email_processing(retry_after) WHERE retry_after IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_email_processing_status_created ON email_processing(processing_status, created_at);
CREATE INDEX IF NOT EXISTS idx_email_processing_status_assessment ON email_processing(processing_status, assessment_created);
CREATE INDEX IF NOT EXISTS idx_email_processing_provider_type_status ON email_processing(email_provider_type, processing_status);
CREATE INDEX IF NOT EXISTS idx_email_processing_batch_status ON email_processing(processing_batch_id, processing_status);

-- Partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_email_processing_active ON email_processing(created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_email_processing_failed_retry ON email_processing(retry_after) WHERE processing_status = 'failed' AND retry_count < 3 AND deleted_at IS NULL;

-- Add comments for documentation
COMMENT ON TABLE email_processing IS 'Enterprise-level tracking of email processing operations';
COMMENT ON COLUMN email_processing.email_provider_id IS 'Unique ID from email provider (Graph API ID or IMAP UID)';
COMMENT ON COLUMN email_processing.email_provider_type IS 'Type of email provider: microsoft_graph or imap';
COMMENT ON COLUMN email_processing.folder_name IS 'Email folder name if folder-based processing';
COMMENT ON COLUMN email_processing.processing_status IS 'Current processing status: pending, processing, completed, failed, skipped, duplicate, quarantined, filtered';
COMMENT ON COLUMN email_processing.processing_method IS 'Method used for processing: graph_api or imap';
COMMENT ON COLUMN email_processing.processing_duration_ms IS 'Processing duration in milliseconds';
COMMENT ON COLUMN email_processing.assessment_id IS 'Reference to created assessment if successful';
COMMENT ON COLUMN email_processing.assessment_created IS 'Whether an assessment was created from this email';
COMMENT ON COLUMN email_processing.error_message IS 'Error message if processing failed';
COMMENT ON COLUMN email_processing.error_type IS 'Type of error: validation_error, database_error, parsing_error, etc.';
COMMENT ON COLUMN email_processing.retry_count IS 'Number of retry attempts';
COMMENT ON COLUMN email_processing.retry_after IS 'Timestamp when retry should be attempted';
COMMENT ON COLUMN email_processing.spam_score IS 'Spam detection score (0-100)';
COMMENT ON COLUMN email_processing.spam_flags IS 'Array of spam detection flags';
COMMENT ON COLUMN email_processing.extracted_data IS 'JSON object with extracted data (claim reference, vehicle info, etc.)';
COMMENT ON COLUMN email_processing.extraction_confidence IS 'Confidence score for data extraction (0-1)';
COMMENT ON COLUMN email_processing.raw_email_data IS 'Sanitized raw email metadata for debugging';
COMMENT ON COLUMN email_processing.request_id IS 'Request ID from API call for tracing';
COMMENT ON COLUMN email_processing.processing_batch_id IS 'Groups related email processing runs together';
COMMENT ON COLUMN email_processing.metadata IS 'Additional flexible metadata';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_processing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER email_processing_updated_at
    BEFORE UPDATE ON email_processing
    FOR EACH ROW
    EXECUTE FUNCTION update_email_processing_updated_at();

-- Create function to get processing statistics
CREATE OR REPLACE FUNCTION get_email_processing_stats(
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    total_processed BIGINT,
    successful BIGINT,
    failed BIGINT,
    skipped BIGINT,
    duplicates BIGINT,
    quarantined BIGINT,
    assessments_created BIGINT,
    avg_processing_time_ms NUMERIC,
    spam_detected BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_processed,
        COUNT(*) FILTER (WHERE processing_status = 'completed')::BIGINT as successful,
        COUNT(*) FILTER (WHERE processing_status = 'failed')::BIGINT as failed,
        COUNT(*) FILTER (WHERE processing_status = 'skipped')::BIGINT as skipped,
        COUNT(*) FILTER (WHERE processing_status = 'duplicate')::BIGINT as duplicates,
        COUNT(*) FILTER (WHERE processing_status = 'quarantined')::BIGINT as quarantined,
        COUNT(*) FILTER (WHERE assessment_created = true)::BIGINT as assessments_created,
        AVG(processing_duration_ms)::NUMERIC as avg_processing_time_ms,
        COUNT(*) FILTER (WHERE is_spam = true)::BIGINT as spam_detected
    FROM email_processing
    WHERE created_at >= start_date
        AND created_at <= end_date
        AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get emails ready for retry
CREATE OR REPLACE FUNCTION get_emails_ready_for_retry(max_retries INTEGER DEFAULT 3)
RETURNS TABLE (
    id UUID,
    email_provider_id TEXT,
    email_provider_type TEXT,
    retry_count INTEGER,
    error_message TEXT,
    raw_email_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ep.id,
        ep.email_provider_id,
        ep.email_provider_type,
        ep.retry_count,
        ep.error_message,
        ep.raw_email_data
    FROM email_processing ep
    WHERE ep.processing_status = 'failed'
        AND ep.retry_count < max_retries
        AND (ep.retry_after IS NULL OR ep.retry_after <= NOW())
        AND ep.deleted_at IS NULL
    ORDER BY ep.created_at ASC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

