import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SecurityHeaders } from './lib/security'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@/lib/supabase/server'
import { log } from './lib/logger'
import { startAuthTimer } from './lib/performance'
import { hasRole } from '@/lib/types/roles'
import { UserRole } from '@/lib/types/user'

interface CookieEntry {
  name: string
  value: string
  options?: Record<string, unknown>
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now()

  // Log request with security context
  log.info('Request received', {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    action: 'middleware_request'
  })

  // Initialize response for security headers
  let response = NextResponse.next()

  // Apply security headers
  Object.entries(SecurityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Initialize Supabase client for auth
  let supabaseResponse = response
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieEntry[]) {
          cookiesToSet.forEach(({ name, value }: CookieEntry) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          supabaseResponse.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
          cookiesToSet.forEach(({ name, value, options }: CookieEntry) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const endAuthTimer = startAuthTimer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  endAuthTimer()

  // Get user profile to determine role
  let userRole: UserRole = UserRole.VIEWER // Default role
  if (user && user.user_metadata?.role) {
    userRole = user.user_metadata.role
  }

  // Refresh session if expired or near expiry - required for PKCE flow
  if (user) {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      // Only refresh if session is expired or within 5 minutes of expiry
      if (session?.expires_at) {
        const now = Math.floor(Date.now() / 1000)
        const timeUntilExpiry = session.expires_at - now

        if (timeUntilExpiry < 300) { // 5 minutes
          await supabase.auth.refreshSession()
        }
      }
    } catch (error) {
      console.error('Failed to refresh session:', error)
      // Continue with the request even if refresh fails
    }
  }

   // Check if in development mode with mock auth
   const useMockAuth = process.env.USE_MOCK_AUTH === 'true'
   
   // Define role-based route access
   const publicRoutes = ['/login', '/api/auth']
   const dashboardRoutes = ['/dashboard', '/dashboard/*']
   const adminRoutes = ['/admin', '/admin/*']
   const apiRoutes = ['/api']

  // Check if current path requires authentication
  const requiresAuth = !publicRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Check if current path requires admin privileges
  const requiresAdmin = adminRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Check if current path is API route
  const isApiRoute = apiRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Handle unauthenticated users
  if (!user) {
    if (isApiRoute && !request.nextUrl.pathname.startsWith('/api/auth')) {
      // Return 401 for protected API routes
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    } else if (!request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/api/auth')) {
      // Redirect to login for protected pages
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // Handle authenticated users - check role-based access
  if (user) {
    // Check admin routes
    if (requiresAdmin && !hasRole(userRole, UserRole.CONTENT_MANAGER)) {
      if (isApiRoute) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      } else {
        // Redirect to dashboard for insufficient permissions
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }

    // Check if user is active
    if (!user.user_metadata?.is_active) {
      if (isApiRoute) {
        return NextResponse.json({ error: 'Account is disabled' }, { status: 403 })
      } else {
        // Log out inactive users and redirect to login
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        // Add error message as query parameter
        url.searchParams.set('error', 'account_disabled')
        return NextResponse.redirect(url)
      }
    }
  }

  // Add timing header for monitoring
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/health (health check endpoint)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/health).*)',
  ],
}