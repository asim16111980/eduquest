'use client'

import { useEffect, useState } from 'react'
import LoginForm from '@/components/shared/LoginForm'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)

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
  }, [])

  const handleSuccess = () => {
    // Redirect is handled by the signIn action
    setError(null)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  return (
    <>
      <div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Welcome to EduQuest Admin Dashboard
        </p>
      </div>

      {/* Error display with aria-live for screen readers */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-red-50 border border-red-200 rounded-md p-4"
        >
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <LoginForm
        onSuccess={handleSuccess}
        onError={handleError}
        className="mt-8"
      />
    </>
  )
}