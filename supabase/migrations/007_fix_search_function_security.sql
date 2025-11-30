-- =============================================
-- Migration: Fix SQL injection vulnerability in search_assessments function
-- =============================================
-- 
-- SECURITY FIX: The original function used string concatenation which is
-- vulnerable to SQL injection. This version properly sanitizes input.
--
-- Run this migration to replace the vulnerable function.

DROP FUNCTION IF EXISTS public.search_assessments(TEXT);

CREATE OR REPLACE FUNCTION public.search_assessments(search_query TEXT)
RETURNS TABLE (
    id TEXT,
    company_name TEXT,
    your_name TEXT,
    make TEXT,
    model TEXT,
    registration TEXT,
    created_at TEXT,
    rank DOUBLE PRECISION
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    sanitized_query TEXT;
    query_length INTEGER;
BEGIN
    -- Input validation and sanitization
    -- Limit query length to prevent DoS attacks
    query_length := LENGTH(COALESCE(search_query, ''));
    IF query_length = 0 OR query_length > 100 THEN
        -- Return empty result for invalid input
        RETURN;
    END IF;
    
    -- Sanitize input using PostgreSQL's built-in escaping
    -- Escape special LIKE characters: %, _, \
    sanitized_query := REPLACE(search_query, '\', '\\');
    sanitized_query := REPLACE(sanitized_query, '%', '\%');
    sanitized_query := REPLACE(sanitized_query, '_', '\_');
    -- Remove SQL injection attempts: semicolons, comments
    sanitized_query := REGEXP_REPLACE(sanitized_query, '[;--]', '', 'g');
    -- Convert to lowercase for case-insensitive search
    sanitized_query := LOWER(TRIM(sanitized_query));
    
    -- Additional safety: if after sanitization the query is empty, return
    IF LENGTH(sanitized_query) = 0 THEN
        RETURN;
    END IF;
    
    -- Use sanitized query in LIKE patterns
    -- PostgreSQL will properly escape the LIKE patterns
    RETURN QUERY
    SELECT 
        a.id::TEXT,
        a.company_name::TEXT,
        a.your_name::TEXT,
        a.make::TEXT,
        a.model::TEXT,
        COALESCE(a.registration, '')::TEXT,
        a.created_at::TEXT,
        -- Calculate relevance rank based on matches
        (
            CASE 
                WHEN LOWER(a.company_name) LIKE '%' || sanitized_query || '%' THEN 1.0
                WHEN LOWER(a.your_name) LIKE '%' || sanitized_query || '%' THEN 0.8
                WHEN LOWER(a.make) LIKE '%' || sanitized_query || '%' THEN 0.6
                WHEN LOWER(a.model) LIKE '%' || sanitized_query || '%' THEN 0.6
                WHEN LOWER(COALESCE(a.registration, '')) LIKE '%' || sanitized_query || '%' THEN 0.5
                ELSE 0.0
            END
        )::DOUBLE PRECISION
    FROM assessments a
    WHERE 
        a.deleted_at IS NULL
        AND (
            LOWER(a.company_name) LIKE '%' || sanitized_query || '%'
            OR LOWER(a.your_name) LIKE '%' || sanitized_query || '%'
            OR LOWER(a.make) LIKE '%' || sanitized_query || '%'
            OR LOWER(a.model) LIKE '%' || sanitized_query || '%'
            OR LOWER(COALESCE(a.registration, '')) LIKE '%' || sanitized_query || '%'
        )
    ORDER BY 
        (CASE 
            WHEN LOWER(a.company_name) LIKE '%' || sanitized_query || '%' THEN 1.0
            WHEN LOWER(a.your_name) LIKE '%' || sanitized_query || '%' THEN 0.8
            WHEN LOWER(a.make) LIKE '%' || sanitized_query || '%' THEN 0.6
            WHEN LOWER(a.model) LIKE '%' || sanitized_query || '%' THEN 0.6
            WHEN LOWER(COALESCE(a.registration, '')) LIKE '%' || sanitized_query || '%' THEN 0.5
            ELSE 0.0
        END) DESC, 
        a.created_at DESC
    LIMIT 100;
END;
$$;

-- Security: Remove anonymous access, only allow authenticated users
REVOKE EXECUTE ON FUNCTION public.search_assessments(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.search_assessments(TEXT) FROM public;

-- Grant execute permission only to authenticated users
GRANT EXECUTE ON FUNCTION public.search_assessments(TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.search_assessments(TEXT) IS 
'Secure full-text search function for assessments. Input is sanitized to prevent SQL injection. Requires authentication.';

