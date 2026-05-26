/**
 * Structured Logging Utility for EduQuest Admin Dashboard
 * Provides consistent, structured logging for debugging and monitoring
 */

export interface LogEntry {
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  context?: Record<string, unknown>
  userId?: string
  requestId?: string
  error?: Error
}

export interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error'
  enableConsole: boolean
  enableFile: boolean
  filePath?: string
  enableStructured: boolean
}

class StructuredLogger {
  private config: LoggerConfig
  private context: Record<string, unknown> = {}

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: 'info',
      enableConsole: true,
      enableFile: false,
      enableStructured: true,
      ...config
    }
  }

  /**
   * Set global context that will be included in all log entries
   */
  setContext(context: Record<string, unknown>): void {
    this.context = { ...this.context, ...context }
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, unknown>): StructuredLogger {
    const childLogger = new StructuredLogger(this.config)
    childLogger.context = { ...this.context, ...context }
    return childLogger
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context)
  }

  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context)
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context)
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, context, error)
  }

  /**
   * Main logging method
   */
  private log(
    level: LogEntry['level'],
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    // Check if this level should be logged
    if (this.shouldLog(level)) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        context: { ...this.context, ...context },
        error
      }

      // Output to console if enabled
      if (this.config.enableConsole) {
        this.outputToConsole(entry)
      }

      // Output to file if enabled
      if (this.config.enableFile && this.config.filePath) {
        this.outputToFile(entry)
      }
    }
  }

  /**
   * Check if a log level should be output based on configured level
   */
  private shouldLog(level: LogEntry['level']): boolean {
    const levels = ['debug', 'info', 'warn', 'error']
    const configuredIndex = levels.indexOf(this.config.level)
    const messageIndex = levels.indexOf(level)
    return messageIndex >= configuredIndex
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const logMethod = entry.level === 'error' ? 'error' : entry.level
    const consoleMethod = console[logMethod] as Console['log']

    if (this.config.enableStructured) {
      // Structured output
      consoleMethod(JSON.stringify(entry, null, 2))
    } else {
      // Human-readable output
      const timestamp = new Date(entry.timestamp).toLocaleTimeString()
      const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`

      if (entry.error) {
        consoleMethod(`${prefix} ${entry.message}`, entry.error, entry.context)
      } else {
        consoleMethod(`${prefix} ${entry.message}`, entry.context)
      }
    }
  }

  /**
   * Output log entry to file (mock implementation)
   */
  private outputToFile(entry: LogEntry): void {
    // In a real implementation, this would write to a log file
    // For now, we'll just log to console
    console.log(`[FILE LOG] ${JSON.stringify(entry)}`)
  }
}

// Create default logger instance
export const logger = new StructuredLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  enableConsole: true,
  enableFile: process.env.NODE_ENV === 'production',
  enableStructured: true
})

// Convenience functions for common logging patterns
export const createLogger = (config?: Partial<LoggerConfig>) => new StructuredLogger(config)

// Request-scoped logger with request ID
export function createRequestLogger(requestId: string, userId?: string): StructuredLogger {
  return logger.child({ requestId, userId })
}

// Performance logger with automatic timing
export function withPerformance<T>(
  operation: string,
  logger: StructuredLogger,
  callback: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const start = performance.now()
    let success = true

    try {
      const result = await callback()
      resolve(result)
      return result
    } catch (error) {
      success = false
      reject(error)
      throw error
    } finally {
      const duration = performance.now() - start
      logger.info(`Operation completed: ${operation}`, {
        operation,
        duration: Math.round(duration),
        success,
        timestamp: new Date().toISOString()
      })
    }
  })
}

// Error logging helper
export function logError(
  error: Error,
  context?: Record<string, unknown>,
  logger?: StructuredLogger
): void {
  const targetLogger = logger || new StructuredLogger()
  targetLogger.error('An error occurred', error, context)
}

// Security logging helper
export function logSecurityEvent(
  event: string,
  details: Record<string, unknown>,
  logger?: StructuredLogger
): void {
  const targetLogger = logger || new StructuredLogger()
  targetLogger.warn(`Security event: ${event}`, {
    event,
    ...details,
    timestamp: new Date().toISOString()
  })
}

// Audit logging helper
export function logAuditEvent(
  action: string,
  userId: string,
  target?: string,
  details?: Record<string, unknown>,
  logger?: StructuredLogger
): void {
  const targetLogger = logger || new StructuredLogger()
  targetLogger.info(`Audit log: ${action}`, {
    action,
    userId,
    target,
    ...details,
    timestamp: new Date().toISOString()
  })
}