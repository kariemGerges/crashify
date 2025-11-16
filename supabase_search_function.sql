-- =============================================
-- Create search_assessments function for full-text search
-- Run this in Supabase SQL Editor
-- =============================================

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
AS $$
BEGIN
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
                WHEN LOWER(a.company_name) LIKE '%' || LOWER(search_query) || '%' THEN 1.0
                WHEN LOWER(a.your_name) LIKE '%' || LOWER(search_query) || '%' THEN 0.8
                WHEN LOWER(a.make) LIKE '%' || LOWER(search_query) || '%' THEN 0.6
                WHEN LOWER(a.model) LIKE '%' || LOWER(search_query) || '%' THEN 0.6
                WHEN LOWER(COALESCE(a.registration, '')) LIKE '%' || LOWER(search_query) || '%' THEN 0.5
                ELSE 0.0
            END
        )::DOUBLE PRECISION
    FROM assessments a
    WHERE 
        a.deleted_at IS NULL
        AND (
            LOWER(a.company_name) LIKE '%' || LOWER(search_query) || '%'
            OR LOWER(a.your_name) LIKE '%' || LOWER(search_query) || '%'
            OR LOWER(a.make) LIKE '%' || LOWER(search_query) || '%'
            OR LOWER(a.model) LIKE '%' || LOWER(search_query) || '%'
            OR LOWER(COALESCE(a.registration, '')) LIKE '%' || LOWER(search_query) || '%'
        )
    ORDER BY 
        (CASE 
            WHEN LOWER(a.company_name) LIKE '%' || LOWER(search_query) || '%' THEN 1.0
            WHEN LOWER(a.your_name) LIKE '%' || LOWER(search_query) || '%' THEN 0.8
            WHEN LOWER(a.make) LIKE '%' || LOWER(search_query) || '%' THEN 0.6
            WHEN LOWER(a.model) LIKE '%' || LOWER(search_query) || '%' THEN 0.6
            WHEN LOWER(COALESCE(a.registration, '')) LIKE '%' || LOWER(search_query) || '%' THEN 0.5
            ELSE 0.0
        END) DESC, 
        a.created_at DESC
    LIMIT 100;
END;
$$;

-- Grant execute permission to authenticated users (or anon if needed)
GRANT EXECUTE ON FUNCTION public.search_assessments(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_assessments(TEXT) TO anon;

