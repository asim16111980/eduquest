import { NextResponse } from 'next/server'
import { testConnection, getUserSession } from '@/lib/queries/test'

export async function GET() {
  try {
    const startTime = Date.now()

    // Test both connection and user session
    const [connectionResult, sessionResult] = await Promise.all([
      testConnection(),
      getUserSession()
    ])

    const latency = Date.now() - startTime

    return NextResponse.json({
      success: true,
      message: 'Test query executed successfully',
      timestamp: new Date().toISOString(),
      latency: `${latency}ms`,
      data: {
        connection: connectionResult,
        session: {
          authenticated: Boolean(sessionResult?.user),
          userId: sessionResult?.user?.id || null,
          message: sessionResult?.user ? 'User is authenticated' : 'No active session'
        },
        performance: {
          latencyMs: latency,
          targetMet: latency < 200,
          threshold: 200
        }
      }
    })
  } catch (error) {
    console.error('Test query API error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Test query failed',
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}