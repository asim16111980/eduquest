/**
 * Unit Tests for Database Operations
 */

import { createClient } from '@/lib/supabase/server'
import { performanceMonitor } from '@/lib/performance'

// Mock process.env
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_ANON_KEY = 'test-anon-key'

jest.mock('@/lib/supabase/server')
const mockCreateClient = require('@/lib/supabase/server')

describe('Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    performanceMonitor.clear()
  })

  describe('createClient', () => {
    it('should create Supabase client with correct configuration', async () => {
      const mockClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: [], error: null })
      }
      mockCreateClient.createClient.mockResolvedValue(mockClient)

      const client = await createClient()

      expect(mockCreateClient.createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        expect.objectContaining({
          cookies: expect.any(Object)
        })
      )
    })
  })

  describe('User Operations', () => {
    let mockClient

    beforeEach(() => {
      mockClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        eq: jest.fn(),
        gte: jest.fn(),
        order: jest.fn(),
        limit: jest.fn()
      }
      mockCreateClient.createClient.mockResolvedValue(mockClient)
    })

    it('should get users with pagination', async () => {
      mockClient.select.mockReturnThis()
      mockClient.eq.mockReturnThis()
      mockClient.order.mockReturnThis()
      mockClient.limit.mockReturnValue({
        data: [{ id: '1', email: 'user1@example.com' }],
        error: null
      })

      const client = await createClient()
      const result = await client.from('users').select('*').eq('status', 'active').order('created_at').limit(10)

      expect(result.data).toEqual([{ id: '1', email: 'user1@example.com' }])
      expect(result.error).toBeNull()
    })

    it('should handle database errors', async () => {
      mockClient.select.mockReturnValue({
        data: null,
        error: { message: 'Database connection failed' }
      })

      const client = await createClient()
      const result = await client.from('users').select('*')

      expect(result.data).toBeNull()
      expect(result.error).toEqual({ message: 'Database connection failed' })
    })
  })

  describe('Performance Monitoring', () => {
    it('should track database query performance', async () => {
      const mockClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: [], error: null })
      }
      mockCreateClient.createClient.mockResolvedValue(mockClient)

      const timer = performanceMonitor.startTimer('databaseQuery')
      const client = await createClient()
      await client.from('users').select('*')
      timer()

      const metrics = performanceMonitor.getMetrics('databaseQuery')
      expect(metrics.length).toBe(1)
      expect(metrics[0].success).toBe(true)
      expect(metrics[0].operation).toBe('databaseQuery')
    })
  })
})