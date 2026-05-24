'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AuthenticationError } from '@/lib/errors'
import { getAuthErrorMessage } from '@/lib/auth/errors'

export async function signIn(formData: FormData) {
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

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new AuthenticationError(getAuthErrorMessage(error))
  }

  if (data.user) {
    // Redirect to dashboard after successful login
    redirect('/dashboard')
  }
}

export async function signOut() {
  const supabase = await createClient()

  try {
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Sign out error:', error)
    // Continue with redirect even if sign out fails
    // The user will be logged out on the next request
  }

  // Clear any session cookies and redirect to login
  redirect('/auth/login')
}