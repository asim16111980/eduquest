import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    let databaseStatus = 'unknown'
    let databaseError = null

    try {
      // Check database connectivity only if Supabase is configured
      if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
        const supabase = await createClient()

        // Simple query to test database connection
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id')
          .limit(1)

        if (error) {
          databaseError = error.message
          databaseStatus = 'down'
        } else {
          databaseStatus = 'up'
        }
      } else {
        databaseStatus = 'not-configured'
      }
    } catch (error) {
      databaseError = error instanceof Error ? error.message : 'Unknown error'
      databaseStatus = 'down'
    }

    // Check basic app health
    const isHealthy = databaseStatus === 'up' || databaseStatus === 'not-configured'

    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      database: databaseStatus,
      ...(databaseError && { databaseError }),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV || 'development'
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