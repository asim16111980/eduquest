import { NextResponse } from 'next/server'
import { testConnection, getUserSession } from '@/lib/queries/test'
import { performanceMonitor } from '@/lib/performance'
import { UserRole, hasRole } from '@/lib/types/database'

const logger = {
  error: (message: string, details?: Record<string, unknown>) => {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, details || '')
  }
}

export async function GET() {
  try {
    const startTime = Date.now()

    // Test both connection and user session
    const [connectionResult, sessionResult] = await Promise.allSettled([
      testConnection(),
      getUserSession()
    ])

    // Extract results or errors
    const connectionStatus = connectionResult.status === 'fulfilled' ? 'success' : 'error'
    const connectionData = connectionResult.status === 'fulfilled' ? connectionResult.value : null
    const connectionError = connectionResult.status === 'rejected' ? connectionResult.reason : null

    const sessionStatus = sessionResult.status === 'fulfilled' ? 'success' : 'error'
    const sessionData = sessionResult.status === 'fulfilled' ? sessionResult.value : null
    const sessionError = sessionResult.status === 'rejected' ? sessionResult.reason : null

    // Get user role for authorization check
    const userRole = sessionData?.user?.app_metadata?.role

    // Restrict diagnostics endpoint to CONTENT_MANAGER and above
    if (!hasRole(userRole || UserRole.STUDENT, UserRole.CONTENT_MANAGER)) {
      // Return stripped response without PII for unauthorized users
      const latency = Date.now() - startTime
      return NextResponse.json({
        success: true,
        message: 'Test query executed successfully',
        timestamp: new Date().toISOString(),
        latency: `${latency}ms`,
        data: {
          connection: {
            success: connectionData?.success ?? false,
            message: connectionData?.message ?? 'Diagnostic data restricted',
          },
          session: {
            authenticated: false,
            message: 'Insufficient permissions',
          },
          performance: {
            latencyMs: latency,
            targetMet: latency < 200,
            threshold: 200
          }
        }
      })
    }

    // Return full diagnostics for authorized users
    const latency = Date.now() - startTime

    return NextResponse.json({
      success: true,
      message: 'Test query executed successfully',
      timestamp: new Date().toISOString(),
      latency: `${latency}ms`,
      data: {
        connection: connectionData,
        session: {
          authenticated: Boolean(sessionData?.user),
          userId: sessionData?.user?.id || null,
          message: sessionData?.user ? 'User is authenticated' : 'No active session'
        },
        performance: {
          latencyMs: latency,
          targetMet: latency < 200,
          threshold: 200
        }
      }
    })
  } catch (error) {
    logger.error('Test query API error', {
      message: error instanceof Error ? error.message : 'Unknown error',
      error
    })

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