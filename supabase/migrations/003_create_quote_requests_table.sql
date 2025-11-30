-- =============================================
-- Migration: Create quote_requests table
-- =============================================

CREATE TABLE IF NOT EXISTS quote_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    vehicle TEXT NOT NULL,
    description TEXT NOT NULL,
    photo_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected', 'payment_received', 'expired')),
    spam_score INTEGER DEFAULT 0 CHECK (spam_score >= 0 AND spam_score <= 100),
    recommended_service TEXT,
    recommended_price DECIMAL(10, 2),
    payment_id TEXT,
    payment_amount DECIMAL(10, 2),
    paid_at TIMESTAMPTZ,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_quote_requests_email ON quote_requests(email);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON quote_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_quote_requests_spam_score ON quote_requests(spam_score);
CREATE INDEX IF NOT EXISTS idx_quote_requests_payment_id ON quote_requests(payment_id);

-- Add comments
COMMENT ON TABLE quote_requests IS 'Quote requests from one-off clients';
COMMENT ON COLUMN quote_requests.spam_score IS 'Spam score 0-100, lower is better';
COMMENT ON COLUMN quote_requests.recommended_service IS 'Service type recommended by admin';
COMMENT ON COLUMN quote_requests.recommended_price IS 'Price recommended by admin';
COMMENT ON COLUMN quote_requests.payment_id IS 'Stripe payment intent ID';
COMMENT ON COLUMN quote_requests.metadata IS 'Additional metadata about the quote request';

