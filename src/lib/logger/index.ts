export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  meta?: Record<string, unknown>
  userId?: string
  action?: string
  resource?: string
}

export interface Logger {
  debug: (message: string, meta?: Record<string, unknown>) => void
  info: (message: string, meta?: Record<string, unknown>) => void
  warn: (message: string, meta?: Record<string, unknown>) => void
  error: (message: string, meta?: Record<string, unknown>) => void
}

class StructuredLogger implements Logger {
  private serviceName: string
  private minLevel: LogLevel

  constructor(serviceName: string = 'eduquest', minLevel: LogLevel = 'info') {
    this.serviceName = serviceName
    this.minLevel = minLevel
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.minLevel)
  }

  private formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
      userId: meta?.userId as string || undefined,
      action: meta?.action as string || undefined,
      resource: meta?.resource as string || undefined
    }
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    if (!this.shouldLog(level)) return

    const entry = this.formatLog(level, message, meta)

    // Console output with structured format
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${this.serviceName}]`
    const logMessage = meta ? `${prefix} ${message} ${JSON.stringify(meta)}` : `${prefix} ${message}`

    switch (level) {
      case 'debug':
        console.debug(logMessage)
        break
      case 'info':
        console.info(logMessage)
        break
      case 'warn':
        console.warn(logMessage)
        break
      case 'error':
        console.error(logMessage)
        break
    }

    // In production, you would send this to a logging service
    // For now, we'll just log to console
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.log('debug', message, meta)
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.log('info', message, meta)
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.log('warn', message, meta)
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.log('error', message, meta)
  }
}

// Create default instance
const logger = new StructuredLogger()

// Export convenience functions
export const log = {
  debug: (message: string, meta?: Record<string, unknown>) => logger.debug(message, meta),
  info: (message: string, meta?: Record<string, unknown>) => logger.info(message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => logger.warn(message, meta),
  error: (message: string, meta?: Record<string, unknown>) => logger.error(message, meta)
}

// Export class for custom instances
export { StructuredLogger }

// Export type for use in other modules