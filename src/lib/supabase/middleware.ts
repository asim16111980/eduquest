import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { startAuthTimer } from '@/lib/performance'
import { hasRole, UserRole } from '@/lib/types/database'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: unknown }>) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as any)
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
  if (user && user.app_metadata?.role) {
    userRole = user.app_metadata.role
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

  // Define role-based route access
  const publicRoutes = ['/auth/login', '/api/auth']
  const dashboardRoutes = ['/dashboard']
  const adminRoutes = ['/admin']
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
    } else if (!request.nextUrl.pathname.startsWith('/auth') && !request.nextUrl.pathname.startsWith('/api/auth')) {
      // Redirect to login for protected pages
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }
  }

  // Handle authenticated users - check role-based access
  if (user) {
    // Check if user is active
    if (!user.app_metadata?.is_active) {
      if (isApiRoute) {
        return NextResponse.json({ error: 'Account is disabled' }, { status: 403 })
      } else {
        // Log out inactive users and redirect to login
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        // Add error message as query parameter
        url.searchParams.set('error', 'account_disabled')
        return NextResponse.redirect(url)
      }
    }

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
  }

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
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}