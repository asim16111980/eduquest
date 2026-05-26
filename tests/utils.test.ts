/**
 * Unit Tests for Utility Functions
 */

import { validateEmail, formatDate, generateId } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('validateEmail', () => {
    it('should validate email addresses correctly', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@domain.org',
        'a@b.co'
      ]

      const invalidEmails = [
        'invalid',
        'invalid@',
        '@domain.com',
        'invalid.email',
        'test@domain',
        'test..domain@example.com',
        ''
      ]

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true)
      })

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false)
      })
    })
  })

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2023-01-01T12:00:00Z')

      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2023-01-01')
      expect(formatDate(date, 'MM/DD/YYYY')).toBe('01/01/2023')
      expect(formatDate(date, 'YYYY-MM-DD HH:mm')).toBe('2023-01-01 12:00')
    })

    it('should handle invalid dates', () => {
      expect(() => formatDate(null as any, 'YYYY-MM-DD')).toThrow()
      expect(() => formatDate(undefined as any, 'YYYY-MM-DD')).toThrow()
    })
  })

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()

      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^[a-zA-Z0-9-]+$/)
      expect(id2).toMatch(/^[a-zA-Z0-9-]+$/)
    })

    it('should generate IDs of correct length', () => {
      const id = generateId()
      expect(id.length).toBeGreaterThan(0)
    })
  })
})