import { NextResponse } from 'next/server'
import { performanceMonitor } from '@/lib/performance'

const logger = {
  error: (message: string, details?: Record<string, unknown>) => {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, details || '')
  }
}

export async function GET() {
  try {
    const authMetrics = performanceMonitor.getMetrics('authentication')
    const dbMetrics = performanceMonitor.getMetrics('database_test_connection')

    // Compute once per request to avoid drift
    const authAvg = performanceMonitor.getAverageDuration('authentication')
    const authSuccess = performanceMonitor.getSuccessRate('authentication')
    const dbAvg = performanceMonitor.getAverageDuration('database_test_connection')
    const dbSuccess = performanceMonitor.getSuccessRate('database_test_connection')

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        authentication: {
          count: authMetrics.length,
          averageMs: authAvg,
          successRate: authSuccess,
          latest: authMetrics.slice(-5),
          threshold: 200
        },
        database: {
          count: dbMetrics.length,
          averageMs: dbAvg,
          successRate: dbSuccess,
          latest: dbMetrics.slice(-5),
          threshold: 100
        }
      },
      summary: {
        totalOperations: authMetrics.length + dbMetrics.length,
        targetMet: authAvg <= 200 && dbAvg <= 100
      }
    })
  } catch (error) {
    logger.error('Performance monitoring API error', {
      message: error instanceof Error ? error.message : 'Unknown error',
      error
    })

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve performance metrics',
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}