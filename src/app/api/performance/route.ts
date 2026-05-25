import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface PerformanceMetrics {
  timestamp: string
  responseTime: number
  memoryUsage: number
  cpuUsage?: number
  activeUsers: number
  databaseQueries: number
  errorRate: number
}

interface LoadTestResult {
  success: boolean
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  maxResponseTime: number
  minResponseTime: number
  throughput: number
  errors: string[]
}

// Simple in-memory store for metrics
const metricsStore: PerformanceMetrics[] = []
const MAX_METRICS = 1000 // Keep last 1000 data points

export async function GET() {
  try {
    // Get current system metrics
    const metrics = getCurrentMetrics()

    // Store metrics
    metricsStore.push(metrics)
    if (metricsStore.length > MAX_METRICS) {
      metricsStore.shift()
    }

    // Return historical data and current metrics
    return NextResponse.json({
      current: metrics,
      historical: metricsStore.slice(-100), // Last 100 data points
      summary: calculateSummary(metricsStore)
    })
  } catch (error) {
    console.error('Performance API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { action, duration = 60, concurrentUsers = 100 } = await request.json()

    if (action === 'start-load-test') {
      const result = await runLoadTest(duration, concurrentUsers)
      return NextResponse.json(result)
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Load test error:', error)
    return NextResponse.json(
      { error: 'Failed to run load test' },
      { status: 500 }
    )
  }
}

function getCurrentMetrics(): PerformanceMetrics {
  const memUsage = process.memoryUsage()
  const startTime = performance.now()

  // Simulate a database query
  setTimeout(() => {}, 0)

  const endTime = performance.now()
  const responseTime = endTime - startTime

  return {
    timestamp: new Date().toISOString(),
    responseTime,
    memoryUsage: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
    activeUsers: Math.floor(Math.random() * 50) + 50, // Simulate 50-100 users
    databaseQueries: Math.floor(Math.random() * 10) + 5, // Simulate 5-15 queries
    errorRate: Math.random() * 0.01 // 0-1% error rate
  }
}

function calculateSummary(metrics: PerformanceMetrics[]) {
  if (metrics.length === 0) return null

  const responseTimes = metrics.map(m => m.responseTime)
  const memoryUsages = metrics.map(m => m.memoryUsage)

  return {
    averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
    maxResponseTime: Math.max(...responseTimes),
    minResponseTime: Math.min(...responseTimes),
    averageMemoryUsage: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
    totalDataPoints: metrics.length,
    timeRange: {
      start: metrics[0].timestamp,
      end: metrics[metrics.length - 1].timestamp
    }
  }
}

async function runLoadTest(duration: number, concurrentUsers: number): Promise<LoadTestResult> {
  const startTime = Date.now()
  const endTime = startTime + (duration * 1000)

  let totalRequests = 0
  let successfulRequests = 0
  let failedRequests = 0
  let totalResponseTime = 0
  let maxResponseTime = 0
  let minResponseTime = Infinity
  const errors: string[] = []

  // Simulate concurrent users
  const promises: Promise<void>[] = []

  for (let i = 0; i < concurrentUsers; i++) {
    promises.push(simulateUserRequest())
  }

  async function simulateUserRequest(): Promise<void> {
    while (Date.now() < endTime) {
      const requestStart = Date.now()

      try {
        // Simulate API call
        await fetch('/api/health')
        successfulRequests++
      } catch (error) {
        failedRequests++
        errors.push(`Request failed: ${error}`)
      }

      const responseTime = Date.now() - requestStart
      totalRequests++
      totalResponseTime += responseTime
      maxResponseTime = Math.max(maxResponseTime, responseTime)
      minResponseTime = Math.min(minResponseTime, responseTime)

      // Random delay between requests (100ms - 1000ms)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 900 + 100))
    }
  }

  // Wait for all simulated users to complete
  await Promise.all(promises)

  const actualDuration = (Date.now() - startTime) / 1000
  const throughput = totalRequests / actualDuration

  return {
    success: failedRequests / totalRequests < 0.05, // Success if < 5% errors
    totalRequests,
    successfulRequests,
    failedRequests,
    averageResponseTime: totalResponseTime / totalRequests,
    maxResponseTime,
    minResponseTime,
    throughput,
    errors: errors.slice(0, 10) // Keep only first 10 errors
  }
}