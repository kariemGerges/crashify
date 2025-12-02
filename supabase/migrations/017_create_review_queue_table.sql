-- =============================================
-- Migration: Create review_queue table
-- REQ-107 to REQ-114: Manual Review Queue
-- =============================================

CREATE TABLE IF NOT EXISTS review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    quote_request_id UUID REFERENCES quote_requests(id) ON DELETE CASCADE,
    spam_score INTEGER NOT NULL DEFAULT 0 CHECK (spam_score >= 0 AND spam_score <= 100),
    recaptcha_score DECIMAL(3, 2) CHECK (recaptcha_score >= 0 AND recaptcha_score <= 1),
    review_reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'more_info_requested')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_review_queue_status ON review_queue(status);
CREATE INDEX IF NOT EXISTS idx_review_queue_assigned_to ON review_queue(assigned_to);
CREATE INDEX IF NOT EXISTS idx_review_queue_assessment_id ON review_queue(assessment_id);
CREATE INDEX IF NOT EXISTS idx_review_queue_quote_request_id ON review_queue(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_review_queue_created_at ON review_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_review_queue_spam_score ON review_queue(spam_score);

-- Add comments
COMMENT ON TABLE review_queue IS 'Manual review queue for suspicious submissions (REQ-107-114)';
COMMENT ON COLUMN review_queue.spam_score IS 'Spam detection score 0-100 (REQ-108)';
COMMENT ON COLUMN review_queue.recaptcha_score IS 'reCAPTCHA score 0-1 (REQ-109)';
COMMENT ON COLUMN review_queue.review_reason IS 'Reason why item needs review (REQ-110)';

