/**
 * Unit Tests for Authentication Components
 */

import { auth } from '@/lib/auth'
import { login, logout } from '@/app/(auth)/login/actions'

// Mock Supabase client
jest.mock('@/lib/supabase/client')
const mockSupabase = require('@/lib/supabase/client')

describe('Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockSignIn = {
        data: { user: { id: '123', email: 'test@example.com' }, session: { access_token: 'token' } },
        error: null
      }
      mockSupabase.auth.signInWithPassword.mockResolvedValue(mockSignIn)

      const result = await login({ email: 'test@example.com', password: 'password123' })

      expect(result.success).toBe(true)
      expect(result.user?.email).toBe('test@example.com')
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should handle login with invalid credentials', async () => {
      const mockSignIn = {
        data: null,
        error: { message: 'Invalid credentials' }
      }
      mockSupabase.auth.signInWithPassword.mockResolvedValue(mockSignIn)

      const result = await login({ email: 'wrong@example.com', password: 'wrongpass' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
    })

    it('should validate email format', async () => {
      const invalidEmails = ['invalid', 'invalid@', '@domain.com', 'invalid.email']

      for (const email of invalidEmails) {
        const result = await login({ email, password: 'password123' })
        expect(result.success).toBe(false)
        expect(result.error).toContain('Invalid email format')
      }
    })
  })

  describe('logout', () => {
    it('should successfully logout', async () => {
      const mockSignOut = {
        data: null,
        error: null
      }
      mockSupabase.auth.signOut.mockResolvedValue(mockSignOut)

      const result = await logout()

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('should handle logout errors', async () => {
      const mockSignOut = {
        data: null,
        error: { message: 'Logout failed' }
      }
      mockSupabase.auth.signOut.mockResolvedValue(mockSignOut)

      const result = await logout()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Logout failed')
    })
  })

  describe('email validation', () => {
    it('should accept valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@domain.org'
      ]

      validEmails.forEach(email => {
        expect(auth.validateEmail(email)).toBe(true)
      })
    })

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@domain.com',
        'invalid.email',
        'test@domain',
        'test..domain@example.com'
      ]

      invalidEmails.forEach(email => {
        expect(auth.validateEmail(email)).toBe(false)
      })
    })
  })
})