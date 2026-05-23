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
      throw new DatabaseError(`Database query failed: ${error.message}`)
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
      throw new DatabaseError(`Auth check failed: ${error.message}`)
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