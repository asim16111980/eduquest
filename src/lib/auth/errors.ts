/**
 * Authentication-specific error messages and helpers
 */

export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_NOT_VERIFIED: 'Please verify your email address first',
  ACCOUNT_LOCKED: 'Account is temporarily locked. Please try again later',
  ACCOUNT_DISABLED: 'Account has been disabled. Please contact support',
  INVALID_TOKEN: 'Invalid or expired session',
  NETWORK_ERROR: 'Unable to connect to authentication service',
  RATE_LIMIT_EXCEEDED: 'Too many attempts. Please wait before trying again',
  PASSWORD_POLICY_VIOLATION: 'Password does not meet security requirements',
  SESSION_EXPIRED: 'Your session has expired. Please log in again',
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to access this resource',
} as const

export function getAuthErrorMessage(error: unknown): string {
  // Handle Supabase auth errors
  if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
    const message = (error as { message: string }).message

    // Map common Supabase auth error messages
    if (message.includes('Invalid login credentials')) {
      return AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS
    }
    if (message.includes('Email not confirmed')) {
      return AUTH_ERROR_MESSAGES.EMAIL_NOT_VERIFIED
    }
    if (message.includes('Account locked')) {
      return AUTH_ERROR_MESSAGES.ACCOUNT_LOCKED
    }
    if (message.includes('disabled')) {
      return AUTH_ERROR_MESSAGES.ACCOUNT_DISABLED
    }
    if (message.includes('Invalid token')) {
      return AUTH_ERROR_MESSAGES.INVALID_TOKEN
    }
    if (message.includes('rate limit')) {
      return AUTH_ERROR_MESSAGES.RATE_LIMIT_EXCEEDED
    }
  }

  // Return user-friendly message for unknown errors
  return AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS
}

export function isAuthError(error: unknown): error is { message: string } {
  return error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string'
}

export function shouldRetryAuth(error: unknown): boolean {
  if (!isAuthError(error)) return false

  const message = error.message

  // Retryable errors
  return message.includes('network') ||
         message.includes('timeout') ||
         message.includes('rate limit')
}