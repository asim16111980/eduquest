export interface SecurityConfig {
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: string[]
        scriptSrc: string[]
        styleSrc: string[]
        imgSrc: string[]
        connectSrc: string[]
      }
    }
  }
  rateLimit: {
    windowMs: number
    max: number
  }
  cors: {
    origin: string[]
    credentials: boolean
  }
}

export const defaultSecurityConfig: SecurityConfig = {
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", ...(process.env.SUPABASE_URL ? [process.env.SUPABASE_URL] : [])]
      }
    }
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? [process.env.NEXT_PUBLIC_APP_URL || '']
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
  }
}

export const sanitizeInput = (input: unknown): string => {
  if (typeof input !== 'string') {
    return ''
  }

  // Remove potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const generateSafeId = (prefix: string = 'id'): string => {
  return `${prefix}_${Math.random().toString(36).substring(2, 15)}`
}

export const SecurityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'"
}