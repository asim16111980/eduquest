import { performanceMonitor, startAuthTimer, startDbTimer } from '@/lib/performance'

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Clear all metrics before each test
    performanceMonitor.clear()
  })

  describe('recordMetric', () => {
    it('should record a successful metric', () => {
      const beforeCount = performanceMonitor.getMetrics().length
      performanceMonitor.recordMetric({
        operation: 'test',
        duration: 100,
        timestamp: new Date(),
        success: true
      })

      expect(performanceMonitor.getMetrics().length).toBe(beforeCount + 1)
      expect(performanceMonitor.getAverageDuration('test')).toBe(100)
      expect(performanceMonitor.getSuccessRate('test')).toBe(100)
    })

    it('should record a failed metric', () => {
      performanceMonitor.recordMetric({
        operation: 'test',
        duration: 100,
        timestamp: new Date(),
        success: false
      })

      expect(performanceMonitor.getSuccessRate('test')).toBe(0)
    })

    it('should keep only last 1000 metrics', () => {
      // Add 1001 metrics
      for (let i = 0; i < 1001; i++) {
        performanceMonitor.recordMetric({
          operation: 'test',
          duration: 100,
          timestamp: new Date(),
          success: true
        })
      }

      const metrics = performanceMonitor.getMetrics()
      expect(metrics.length).toBe(1000)
    })
  })

  describe('getAverageDuration', () => {
    it('should return 0 when no metrics exist', () => {
      expect(performanceMonitor.getAverageDuration('nonexistent')).toBe(0)
    })

    it('should calculate average duration correctly', () => {
      performanceMonitor.recordMetric({
        operation: 'test',
        duration: 100,
        timestamp: new Date(),
        success: true
      })
      performanceMonitor.recordMetric({
        operation: 'test',
        duration: 200,
        timestamp: new Date(),
        success: true
      })

      expect(performanceMonitor.getAverageDuration('test')).toBe(150)
    })
  })

  describe('getSuccessRate', () => {
    it('should return 0 when no metrics exist', () => {
      expect(performanceMonitor.getSuccessRate('nonexistent')).toBe(0)
    })

    it('should calculate success rate correctly', () => {
      performanceMonitor.recordMetric({
        operation: 'test',
        duration: 100,
        timestamp: new Date(),
        success: true
      })
      performanceMonitor.recordMetric({
        operation: 'test',
        duration: 200,
        timestamp: new Date(),
        success: false
      })

      expect(performanceMonitor.getSuccessRate('test')).toBe(50)
    })
  })

  describe('convenience functions', () => {
    it('should create auth timer correctly', () => {
      const endTimer = startAuthTimer()
      endTimer()

      const metrics = performanceMonitor.getMetrics('authentication')
      expect(metrics.length).toBe(1)
      expect(metrics[0].operation).toBe('authentication')
    })

    it('should create database timer correctly', () => {
      const endTimer = startDbTimer('query')
      endTimer()

      const metrics = performanceMonitor.getMetrics()
      expect(metrics.length).toBe(1)
      expect(metrics[0].operation).toBe('database_query')
    })
  })

  describe('threshold logging', () => {
    beforeEach(() => {
      jest.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should log slow operations', () => {
      // Test with an operation that has a threshold
      performanceMonitor.recordMetric({
        operation: 'authentication',
        duration: 300, // Above default threshold of 200
        timestamp: new Date(),
        success: false
      })

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow authentication: 300ms')
      )
    })
  })
})