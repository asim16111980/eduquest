'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { AuthenticationError } from '@/lib/errors'
import { getAuthErrorMessage } from '@/lib/auth/errors'

export async function signIn(formData: FormData, _prevState: { error?: string } | undefined) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    throw new AuthenticationError('Email and password are required')
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new AuthenticationError('Please enter a valid email address')
  }

  console.log('USE_MOCK_AUTH:', process.env.USE_MOCK_AUTH)
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL?.substring(0, 20) + '...')
  console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY?.substring(0, 20) + '...')

  // Check if Supabase is properly configured (not using placeholder values)
  // If USE_MOCK_AUTH=true, always use mock auth even if credentials are present
  const useMockAuth = process.env.USE_MOCK_AUTH === 'true'
  const hasValidSupabaseConfig = 
    process.env.SUPABASE_URL && 
    process.env.SUPABASE_ANON_KEY &&
    !process.env.SUPABASE_URL.includes('EXAMPLE') &&
    !process.env.SUPABASE_URL.includes('your_project_ref') &&
    !process.env.SUPABASE_ANON_KEY.includes('EXAMPLE') &&
    !process.env.SUPABASE_ANON_KEY.includes('your_anon_key')

  const isSupabaseConfigured = hasValidSupabaseConfig && !useMockAuth

  console.log('useMockAuth:', useMockAuth)
  console.log('hasValidSupabaseConfig:', hasValidSupabaseConfig)
  console.log('isSupabaseConfigured:', isSupabaseConfigured)

  // Check if mock auth should be used
  if (useMockAuth || !hasValidSupabaseConfig) {
    const { getMockUser, createMockSession } = await import('@/lib/auth/dev-auth')
    console.log('Using mock auth')
    
    const user = getMockUser(email, password)

    if (!user) {
      return { error: 'Invalid email or password' }
    }

    // Create mock session
    const session = createMockSession(user)

    // Set cookies on the current request context
    // We need to use cookies() from next/headers
    const cookies = await import('next/headers').then(m => m.cookies)
    const cookieStore = await cookies()
    cookieStore.set('mock-session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })
    cookieStore.set('mock-user', encodeURIComponent(JSON.stringify(user)), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })

    // Perform redirect (this throws a special redirect error internally)
    redirect('/dashboard')
  } else {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: getAuthErrorMessage(error) }
      }

      if (data.user) {
        redirect('/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
      return { error: 'An unexpected error occurred. Please try again' }
    }
  }
  
  // This should never be reached if redirect() is called successfully
  return { error: 'An unexpected error occurred. Please try again' }
}

export async function signOut() {
  const useMockAuth = process.env.USE_MOCK_AUTH === 'true'
  
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && !useMockAuth) {
    try {
      const supabase = await createClient()
      await supabase.auth.signOut()
      // Clear any session cookies and redirect to login
      redirect('/login')
    } catch (error) {
      console.error('Sign out error:', error)
      // Still redirect to login even if sign out fails
      // The user will be logged out on the next request
      redirect('/login')
    }
  } else {
    // For development mode, clear cookies and redirect
    const cookies = await import('next/headers').then(m => m.cookies)
    const cookieStore = await cookies()
    cookieStore.set('mock-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    })
    cookieStore.set('mock-user', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    })
    redirect('/login')
  }
}
