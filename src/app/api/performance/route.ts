import { NextResponse } from 'next/server'
import { performanceMonitor } from '@/lib/performance'

export async function GET() {
  try {
    const authMetrics = performanceMonitor.getMetrics('authentication')
    const dbMetrics = performanceMonitor.getMetrics('database_test_connection')

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        authentication: {
          count: authMetrics.length,
          averageMs: performanceMonitor.getAverageDuration('authentication'),
          successRate: performanceMonitor.getSuccessRate('authentication'),
          latest: authMetrics.slice(-5),
          threshold: 200
        },
        database: {
          count: dbMetrics.length,
          averageMs: performanceMonitor.getAverageDuration('database_test_connection'),
          successRate: performanceMonitor.getSuccessRate('database_test_connection'),
          latest: dbMetrics.slice(-5),
          threshold: 100
        }
      },
      summary: {
        totalOperations: authMetrics.length + dbMetrics.length,
        targetMet: (
          performanceMonitor.getAverageDuration('authentication') <= 200 &&
          performanceMonitor.getAverageDuration('database_test_connection') <= 100
        )
      }
    })
  } catch (error) {
    console.error('Performance monitoring API error:', error)

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