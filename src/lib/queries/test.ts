import { createClient } from '@/lib/supabase/server'
import { DatabaseError } from '@/lib/errors'
import { startDbTimer, startAuthTimer } from '@/lib/performance'

// Simple structured logger for now
const logger = {
  error: (message: string, details?: Record<string, unknown>) => {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, details || '')
  }
}

export async function testConnection() {
  try {
    const supabase = await createClient()
    const endDbTimer = startDbTimer('test_connection')

    // Test basic query
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .limit(1)
      .maybeSingle()

    endDbTimer()

    if (error) {
      // Log the raw error for debugging but don't expose to UI
      logger.error('Database query error in testConnection', {
        message: error.message,
        code: error.code,
        query: 'profiles.select.id,email.created_at.limit1.maybeSingle'
      })
      throw new DatabaseError('Database query failed')
    }

    // Null data is acceptable for connectivity check
    if (data === null) {
      return {
        success: true,
        data: null,
        message: 'Database connection successful (no data returned)',
      }
    }

    return {
      success: true,
      data,
      message: 'Database connection successful',
    }
  } catch (error) {
    logger.error('Test connection error', {
      message: error instanceof Error ? error.message : 'Unknown error',
      function: 'testConnection',
      timestamp: new Date().toISOString()
    })
    throw error
  }
}

export async function getUserSession() {
  try {
    const supabase = await createClient()
    const endAuthTimer = startAuthTimer()

    const { data: { user }, error } = await supabase.auth.getUser()

    endAuthTimer()

    if (error) {
      // Log the raw error for debugging but don't expose to UI
      logger.error('Auth check error in getUserSession', {
        message: error.message,
        code: error.code
      })
      throw new DatabaseError('Auth check failed')
    }

    return {
      success: true,
      user,
      message: 'User session retrieved successfully',
    }
  } catch (error) {
    logger.error('Get user session error', {
      message: error instanceof Error ? error.message : 'Unknown error',
      function: 'getUserSession',
      timestamp: new Date().toISOString()
    })
    throw error
  }
}