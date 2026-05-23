export class EduQuestError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'EduQuestError'
  }
}

export class AuthenticationError extends EduQuestError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends EduQuestError {
  constructor(message: string = 'You are not authorized to perform this action') {
    super(message, 'AUTHZ_ERROR', 403)
    this.name = 'AuthorizationError'
  }
}

export class ValidationError extends EduQuestError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
    this.details = { field }
  }
}

export class DatabaseError extends EduQuestError {
  constructor(message: string = 'Database operation failed') {
    super(message, 'DB_ERROR', 500)
    this.name = 'DatabaseError'
  }
}

export class NetworkError extends EduQuestError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR', 503)
    this.name = 'NetworkError'
  }
}

export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof EduQuestError) {
    // Return user-friendly messages for known error types
    switch (error.code) {
      case 'AUTH_ERROR':
        return 'Please log in to continue'
      case 'AUTHZ_ERROR':
        return 'You do not have permission to access this resource'
      case 'VALIDATION_ERROR':
        return error.details?.field ? `Invalid field: ${error.details.field}` : 'Please check your input and try again'
      case 'DB_ERROR':
        return 'A database error occurred. Please try again later'
      case 'NETWORK_ERROR':
        return 'Unable to connect to the server. Please check your internet connection'
      default:
        return error.message || 'An unexpected error occurred'
    }
  }

  // Fallback for unknown errors
  return 'An unexpected error occurred. Please try again'
}

export function isErrorWithCode(error: unknown, code: string): error is EduQuestError {
  return error instanceof EduQuestError && error.code === code
}