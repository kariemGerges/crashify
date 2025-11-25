// =============================================
// FILE: lib/supabase/queries.ts
// Optimized database queries with caching
// =============================================

// import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { supabase } from '@/server/lib/supabase/client';
import type { Database } from '@/server/lib/types/database.types';

type Assessment = Database['public']['Tables']['assessments']['Row'];
// type UploadedFileRow = Database['public']['Tables']['uploaded_files']['Row'];

// Cache assessment by ID (5 minutes cache)
export const getAssessmentById = unstable_cache(
    async (id: string) => {
        const { data, error } = await supabase
            .from('assessments')
            .select(
                `
        *,
        uploaded_files (*)
      `
            )
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (error) throw error;
        return data;
    },
    ['assessment-by-id'],
    {
        revalidate: 300, // 5 minutes
        tags: ['assessment'],
    }
);

// Cache recent assessments (2 minutes cache)
export const getRecentAssessments = unstable_cache(
    async (limit: number = 20) => {
        const { data, error } = await supabase
            .from('assessments')
            .select(
                'id, company_name, your_name, make, model, status, created_at'
            )
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    },
    ['recent-assessments'],
    {
        revalidate: 120, // 2 minutes
        tags: ['assessments-list'],
    }
);

// Cache company assessments (5 minutes cache)
export const getAssessmentsByCompany = unstable_cache(
    async (companyName: string, page: number = 1, pageSize: number = 20) => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await supabase
            .from('assessments')
            .select('*', { count: 'exact' })
            .eq('company_name', companyName)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return { data, count, page, pageSize };
    },
    ['assessments-by-company'],
    {
        revalidate: 300,
        tags: ['assessments-list'],
    }
);

// Full-text search (no cache - real-time results)
// I removed search_query: query, because it was causing a type error

export async function searchAssessments(query: string): Promise<Assessment[]> {
    // const { data, error } = await supabase.rpc('search_assessments');
    const { data, error } = await (supabase.rpc as unknown as {
        (functionName: 'search_assessments', args: { search_query: string }): Promise<{
            data: Assessment[] | null;
            error: { message: string } | null;
        }>;
    })('search_assessments', { search_query: query });
    if (error) throw error;
    return data as Assessment[];
}

// Get assessment stats (cached for 1 hour)
export const getAssessmentStats = unstable_cache(
    async () => {
        const { data, error } = await supabase
            .from('assessments')
            .select('status, assessment_type, created_at')
            .is('deleted_at', null);

        if (error) throw error;

        const stats = {
            total: data.length,
            pending: data.filter(
                (a: { status: string }) => a.status === 'pending'
            ).length,
            processing: data.filter(
                (a: { status: string }) => a.status === 'processing'
            ).length,
            completed: data.filter(
                (a: { status: string }) => a.status === 'completed'
            ).length,
            desktop: data.filter(
                (a: { assessment_type: string }) =>
                    a.assessment_type === 'Desktop Assessment'
            ).length,
            onsite: data.filter(
                (a: { assessment_type: string }) =>
                    a.assessment_type === 'Onsite Assessment'
            ).length,
        };

        return stats;
    },
    ['assessment-stats'],
    {
        revalidate: 3600, // 1 hour
        tags: ['stats'],
    }
);
