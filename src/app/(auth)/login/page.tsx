'use client'

import { useEffect, useState } from 'react'
import LoginForm from '@/components/shared/LoginForm'
import { getAuthErrorMessage } from '@/lib/auth/errors'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [devMode, setDevMode] = useState(false)

  useEffect(() => {
    // Check for error message in URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const errorParam = urlParams.get('error')

    if (errorParam) {
      switch (errorParam) {
        case 'account_disabled':
          setError('Your account has been disabled. Please contact support.')
          break
        case 'session_expired':
          setError('Your session has expired. Please log in again.')
          break
        default:
          setError('An error occurred. Please try again.')
      }
    }

    // Check if we're in development mode (either mock auth enabled or no Supabase config)
    const useMockAuth = process.env.USE_MOCK_AUTH === 'true'
    const hasValidSupabaseConfig = 
      process.env.SUPABASE_URL && 
      process.env.SUPABASE_ANON_KEY &&
      !process.env.SUPABASE_URL.includes('EXAMPLE') &&
      !process.env.SUPABASE_URL.includes('your_project_ref') &&
      !process.env.SUPABASE_ANON_KEY.includes('EXAMPLE') &&
      !process.env.SUPABASE_ANON_KEY.includes('your_anon_key')

    setDevMode(useMockAuth || !hasValidSupabaseConfig)
  }, [])

  const handleSuccess = () => {
    // Redirect is handled by the signIn action
    setError(null)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome to EduQuest Admin Dashboard
          </p>

          {devMode && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-600 text-center">
                Development Mode: Use any email and password to login
              </p>
              <div className="mt-2 space-y-1 text-xs text-blue-700">
                <p>• admin@eduquest.com - Admin User</p>
                <p>• teacher@eduquest.com - Teacher User</p>
                <p>• student@eduquest.com - Student User</p>
              </div>
            </div>
          )}
        </div>

        <LoginForm
          onSuccess={handleSuccess}
          onError={handleError}
          className="mt-8"
        />
      </div>
    </div>
  )
}