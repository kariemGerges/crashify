-- =============================================
-- Migration: Fix complaint number generation race condition
-- Fixes duplicate key errors when multiple complaints are created simultaneously
-- =============================================

-- Drop and recreate the function with advisory locks to prevent race conditions
CREATE OR REPLACE FUNCTION generate_complaint_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
    complaint_num TEXT;
    lock_id BIGINT;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    
    -- Use advisory lock to prevent race conditions
    -- Lock ID is based on year to allow concurrent inserts for different years
    -- Convert year string to a numeric lock ID
    lock_id := ('x' || substr(md5('complaint_number_' || year_part), 1, 8))::bit(32)::bigint;
    
    -- Acquire advisory lock (blocks until available, automatically released at end of transaction)
    PERFORM pg_advisory_xact_lock(lock_id);
    
    -- Get the next sequence number for this year
    -- The advisory lock ensures only one transaction can execute this at a time for the same year
    -- Extract the 3-digit sequence from the end (last 3 characters after the dash)
    -- Format is: COMP-YYYY-XXX, so we need the last 3 digits
    SELECT COALESCE(MAX(CAST(RIGHT(complaint_number, 3) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM complaints
    WHERE complaint_number LIKE 'COMP-' || year_part || '-%';
    
    -- Format: COMP-YYYY-XXX (3-digit sequence)
    complaint_num := 'COMP-' || year_part || '-' || LPAD(sequence_num::TEXT, 3, '0');
    
    -- Lock is automatically released at end of transaction
    RETURN complaint_num;
END;
$$;

-- Also update the trigger function to handle the case where complaint_number might already be set
CREATE OR REPLACE FUNCTION set_complaint_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only generate if complaint_number is NULL or empty
    IF NEW.complaint_number IS NULL OR NEW.complaint_number = '' THEN
        NEW.complaint_number := generate_complaint_number();
    END IF;
    
    -- Set SLA deadline if not set
    IF NEW.sla_deadline IS NULL THEN
        NEW.sla_deadline := calculate_sla_deadline(NEW.priority);
    END IF;
    
    -- Update updated_at timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$;

