'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AuthenticationError } from '@/lib/errors'

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

  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new AuthenticationError(error.message)
    }

    if (data.user) {
      // Redirect to dashboard after successful login
      redirect('/dashboard')
    }
  } catch (error) {
    // Re-throw the error to be handled by the form
    throw error
  }
}

export async function signOut() {
  const supabase = await createServerClient()

  try {
    await supabase.auth.signOut()
    // Clear any session cookies and redirect to login
    redirect('/auth/login')
  } catch (error) {
    console.error('Sign out error:', error)
    // Still redirect to login even if sign out fails
    // The user will be logged out on the next request
    redirect('/auth/login')
  }
}