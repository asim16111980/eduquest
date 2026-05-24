import { createClient } from '@/lib/supabase/server'
import { DatabaseError } from '@/lib/errors'
import { startDbTimer } from '@/lib/performance'

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
      console.error('Database query error:', error)
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
    console.error('Test connection error:', error)
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
      console.error('Auth check error:', error)
      throw new DatabaseError('Auth check failed')
    }

    return {
      success: true,
      user,
      message: 'User session retrieved successfully',
    }
  } catch (error) {
    console.error('Get user session error:', error)
    throw error
  }
}