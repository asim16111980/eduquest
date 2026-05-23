import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DatabaseError } from '@/lib/errors'

export async function GET() {
  try {
    const supabase = await createClient()

    // Test basic connection
    const { data, error } = await supabase.from('health_check').select('*').limit(1)

    if (error) {
      throw new DatabaseError(`Supabase connection failed: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      timestamp: new Date().toISOString(),
      data: data || null,
    })
  } catch (error) {
    console.error('Test API error:', error)

    console.error('Test API error details:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Supabase connection failed',
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}