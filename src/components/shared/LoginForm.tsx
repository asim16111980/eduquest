'use client'

import { useState } from 'react'
import { signIn } from '@/app/(auth)/login/actions'
import { getUserFriendlyMessage } from '@/lib/errors'
import { NextResponse } from 'next/server'

interface LoginFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  className?: string
}

 export default function LoginForm({ onSuccess, onError, className = '' }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    
    try {
      await signIn(formData, undefined)
      // If we get here without exception, redirect happened - success
      onSuccess?.()
    } catch (err: any) {
      setIsSubmitting(false)
      // Next.js redirect throws a special error with digest starting with 'NEXT_REDIRECT'
      if (err?.digest?.startsWith('NEXT_REDIRECT')) {
        // This is actually a success - redirect will happen automatically
        onSuccess?.()
      } else {
        const errorMessage = getUserFriendlyMessage(err)
        setError(errorMessage)
        onError?.(errorMessage)
      }
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <button
              type="button"
              className="font-medium text-indigo-600 hover:text-indigo-500"
              disabled
              title="Password reset coming soon"
            >
              Forgot your password?
            </button>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  )
}
