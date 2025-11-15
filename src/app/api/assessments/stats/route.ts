// =============================================
// FILE: app/api/assessments/stats/route.ts
// GET: Get assessment statistics
// =============================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/server/lib/supabase/client'
import type { Database } from '@/server/lib/types/database.types'
import { unstable_cache } from 'next/cache'

type AssessmentRow = Database['public']['Tables']['assessments']['Row']
type StatusData = Pick<AssessmentRow, 'status'>[]
type TypeData = Pick<AssessmentRow, 'assessment_type'>[]

export const runtime = 'nodejs'

const getCachedStats = unstable_cache(
  async () => {
    const supabase = createServerClient()

    // Get counts by status
    // Type assertion needed due to TypeScript inference issue with Supabase client
    const { data: statusDataRaw } = await (supabase
      .from('assessments') as any)
      .select('status')
      .is('deleted_at', null)
    const statusData = statusDataRaw as StatusData | null

    // Get counts by type
    // Type assertion needed due to TypeScript inference issue with Supabase client
    const { data: typeDataRaw } = await (supabase
      .from('assessments') as any)
      .select('assessment_type')
      .is('deleted_at', null)
    const typeData = typeDataRaw as TypeData | null

    // Get recent submissions (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { count: recentCount } = await supabase
      .from('assessments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())
      .is('deleted_at', null)

    const stats = {
      total: statusData?.length || 0,
      pending: statusData?.filter((a) => a.status === 'pending').length || 0,
      processing:
        statusData?.filter((a) => a.status === 'processing').length || 0,
      completed:
        statusData?.filter((a) => a.status === 'completed').length || 0,
      desktop:
        typeData?.filter((a) => a.assessment_type === 'Desktop Assessment')
          .length || 0,
      onsite:
        typeData?.filter((a) => a.assessment_type === 'Onsite Assessment')
          .length || 0,
      recentSubmissions: recentCount || 0,
    }

    return stats
  },
  ['assessment-stats-api'],
  {
    revalidate: 300, // 5 minutes
    tags: ['stats'],
  }
)

export async function GET(request: NextRequest) {
  try {
    const stats = await getCachedStats()
    return NextResponse.json({ data: stats })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}