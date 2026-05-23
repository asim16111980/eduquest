import { createClient } from '@/lib/supabase/server'
import { DatabaseError } from '@/lib/errors'

export async function testConnection() {
  try {
    const supabase = await createClient()

    // Test basic query
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .limit(1)
      .maybeSingle()

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

    const { data: { user }, error } = await supabase.auth.getUser()

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