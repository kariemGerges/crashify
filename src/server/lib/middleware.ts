// =============================================
// FILE: middleware.ts (Optional - Rate limiting)
// Add rate limiting to API routes
// =============================================

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter (for production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT = 100 // requests per window
const RATE_WINDOW = 60 * 1000 // 1 minute

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Extract IP address from headers (handles proxies and load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'anonymous'
  const now = Date.now()

  const rateLimit = rateLimitMap.get(ip)

  if (!rateLimit || now > rateLimit.resetTime) {
    // Reset rate limit
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_WINDOW,
    })
    return NextResponse.next()
  }

  if (rateLimit.count >= RATE_LIMIT) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }

  // Increment counter
  rateLimit.count++
  rateLimitMap.set(ip, rateLimit)

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}