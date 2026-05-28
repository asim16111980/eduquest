import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SecurityHeaders } from './lib/security'
import { log } from './lib/logger'

export function middleware(request: NextRequest) {
  const startTime = Date.now()

  // Log request with security context
  log.info('Request received', {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    action: 'middleware_request'
  })

  // Apply security headers
  const response = NextResponse.next()

  Object.entries(SecurityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Add timing header for monitoring
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/health).*)',
  ],
}