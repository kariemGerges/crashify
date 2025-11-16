// =============================================
// FILE: app/api/assessments/search/route.ts
// http://localhost:3000/api/assessments/search?q=tesla  example
// GET: Full-text search across assessments
// =============================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/server/lib/supabase/client'
import type { Database } from '@/server/lib/types/database.types'

type SearchAssessmentsReturns = Database['public']['Functions']['search_assessments']['Returns']

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      )
    }

    // Use full-text search function
    // Type assertion needed due to TypeScript inference issue with Supabase client
    const { data, error } = await (supabase.rpc as any)(
      'search_assessments',
      { search_query: query.trim() }
    ) as { data: SearchAssessmentsReturns | null; error: any }

    if (error) {
      return NextResponse.json(
        { error: 'Search failed', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Search error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}