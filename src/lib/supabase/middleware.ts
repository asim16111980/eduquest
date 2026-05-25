import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { startAuthTimer } from '@/lib/performance'
import { hasRole, UserRole } from '@/lib/types/database'

interface CookieEntry {
  name: string
  value: string
  options?: Record<string, unknown>
}

async function cookieToEntry(cookie: any): Promise<CookieEntry> {
  const sameSite = typeof cookie.sameSite === 'boolean' ? (cookie.sameSite ? 'strict' : 'none') : cookie.sameSite
  return {
    name: cookie.name,
    value: cookie.value,
    options: {
      path: cookie.path || '/',
      domain: cookie.domain,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      sameSite: sameSite as 'strict' | 'lax' | 'none',
      maxAge: cookie.maxAge,
      expires: cookie.expires ? new Date(cookie.expires) : undefined,
    }
  }
}

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
        setAll(cookiesToSet: CookieEntry[]) {
          cookiesToSet.forEach(({ name, value }: CookieEntry) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
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
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const cookiesToCopy = await Promise.all(supabaseResponse.cookies.getAll().map(c => cookieToEntry(c)))
      cookiesToCopy.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      return response
    } else if (!request.nextUrl.pathname.startsWith('/auth') && !request.nextUrl.pathname.startsWith('/api/auth')) {
      // Redirect to login for protected pages
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      const response = NextResponse.redirect(url)
      const cookiesToCopy = await Promise.all(supabaseResponse.cookies.getAll().map(c => cookieToEntry(c)))
      cookiesToCopy.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      return response
    }
  }

      // Handle unauthenticated users - check role-based access
      if (user) {
        // Check if user is active
        if (!user.app_metadata?.is_active) {
          if (isApiRoute) {
            const response = NextResponse.json({ error: 'Account is disabled' }, { status: 403 })
            const cookiesToCopy = await Promise.all(supabaseResponse.cookies.getAll().map(c => cookieToEntry(c)))
            cookiesToCopy.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
            return response
        } else {
          // Redirect to dashboard for insufficient permissions
          const url = request.nextUrl.clone()
          url.pathname = '/dashboard'
          const response = NextResponse.redirect(url)
          const cookiesToCopy = await Promise.all(supabaseResponse.cookies.getAll().map(c => cookieToEntry(c)))
          cookiesToCopy.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          return response
        }
      }

    // Check if user is active
    if (!user.app_metadata?.is_active) {
      if (isApiRoute) {
        const response = NextResponse.json({ error: 'Account is disabled' }, { status: 403 })
        // Copy cookies from supabaseResponse to preserve any updates
        const cookiesToCopy = supabaseResponse.cookies.getAll()
        cookiesToCopy.forEach(cookie => {
          response.cookies.set(cookie.name, cookie.value, {
            path: cookie.path || '/',
            domain: cookie.domain,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            sameSite: cookie.sameSite as 'strict' | 'lax' | 'none',
            maxAge: cookie.maxAge,
            expires: cookie.expires ? new Date(cookie.expires) : undefined,
          })
        })
        return response
          } else {
            // Log out inactive users and redirect to login
            const url = request.nextUrl.clone()
            url.pathname = '/auth/login'
            // Add error message as query parameter
            url.searchParams.set('error', 'account_disabled')
            const response = NextResponse.redirect(url)
            const cookiesToCopy = await Promise.all(supabaseResponse.cookies.getAll().map(c => cookieToEntry(c)))
            cookiesToCopy.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
            return response
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