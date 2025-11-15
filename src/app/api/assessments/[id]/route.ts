// =============================================
// FILE: app/api/assessments/[id]/route.ts
// GET: Get single assessment with files
// PATCH: Update assessment
// DELETE: Soft delete assessment
// =============================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/server/lib/supabase/client'
import type { Database } from '@/server/lib/types/database.types'
import { revalidateTag } from 'next/cache'

type GetAssessmentFullArgs = Database['public']['Functions']['get_assessment_full']['Args']
type GetAssessmentFullReturns = Database['public']['Functions']['get_assessment_full']['Returns']
type AssessmentUpdate = Database['public']['Tables']['assessments']['Update']

export const runtime = 'nodejs'

// GET: Get single assessment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { id } = params

    // Use optimized function
    // Type assertion needed due to TypeScript inference issue with Supabase client
    const { data, error } = await (supabase.rpc as any)(
      'get_assessment_full',
      { assessment_uuid: id }
    ) as { data: GetAssessmentFullReturns | null; error: any }

    if (error || !data || data.length === 0) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: data[0] })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH: Update assessment
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { id } = params
    const updates = await request.json()

    // Remove fields that shouldn't be updated
    delete updates.id
    delete updates.created_at
    delete updates.deleted_at

    // Type assertion needed due to TypeScript inference issue with Supabase client
    const { data, error } = await (supabase
      .from('assessments') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update assessment', details: error.message },
        { status: 500 }
      )
    }

    // Invalidate cache
    revalidateTag('assessment')
    revalidateTag('assessments-list')

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Soft delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { id } = params

    // Type assertion needed due to TypeScript inference issue with Supabase client
    const { error } = await (supabase
      .from('assessments') as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete assessment', details: error.message },
        { status: 500 }
      )
    }

    // Invalidate cache
    revalidateTag('assessments-list')
    revalidateTag('stats')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}