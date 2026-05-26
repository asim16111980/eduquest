import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Check database connectivity
    const supabase = await createClient()

    // Simple query to test database connection
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (error) {
      console.error('Health check failed:', error)
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Database connection failed',
          database: 'down'
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'up',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || 'unknown'
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 503 }
    )
  }
}