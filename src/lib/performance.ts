interface PerformanceMetrics {
  operation: string
  duration: number
  timestamp: Date
  success: boolean
  metadata?: Record<string, unknown>
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private thresholds = {
    authentication: 200, // ms
    databaseQuery: 100, // ms
    apiResponse: 300, // ms
    pageLoad: 2500, // ms (LCP target)
  }

  startTimer(operation: string): () => void {
    const start = Date.now()

    return () => {
      const duration = Date.now() - start
      this.recordMetric({
        operation,
        duration,
        timestamp: new Date(),
        success: duration <= (this.thresholds[operation as keyof typeof this.thresholds] ?? Infinity),
        metadata: {
          threshold: this.thresholds[operation as keyof typeof this.thresholds],
        }
      })
    }
  }

  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric)

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Log slow operations
    const threshold = this.thresholds[metric.operation as keyof typeof this.thresholds] ?? Infinity
    if (metric.duration > threshold) {
      console.warn(`Slow ${metric.operation}: ${metric.duration}ms (threshold: ${threshold}ms)`)
    }
  }

  getMetrics(operation?: string): PerformanceMetrics[] {
    if (operation) {
      return this.metrics.filter(m => m.operation === operation)
    }
    return this.metrics
  }

  getAverageDuration(operation: string): number {
    const operationMetrics = this.getMetrics(operation)
    if (operationMetrics.length === 0) return 0

    const total = operationMetrics.reduce((sum, m) => sum + m.duration, 0)
    return total / operationMetrics.length
  }

  getSuccessRate(operation: string): number {
    const operationMetrics = this.getMetrics(operation)
    if (operationMetrics.length === 0) return 0

    const successful = operationMetrics.filter(m => m.success).length
    return (successful / operationMetrics.length) * 100
  }

  clear(): void {
    this.metrics = []
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Convenience functions
export function startAuthTimer(): () => void {
  return performanceMonitor.startTimer('authentication')
}

export function startDbTimer(operation: string): () => void {
  return performanceMonitor.startTimer(`database_${operation}`)
}

export function startApiTimer(operation: string): () => void {
  return performanceMonitor.startTimer(`api_${operation}`)
}