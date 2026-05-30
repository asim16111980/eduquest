/**
 * Structured Logger for EduQuest
 *
 * Provides structured logging with security context and performance metrics
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  action?: string
  userId?: string
  ip?: string
  duration?: number
}

// Enhanced structured logger for production use
export class StructuredLogger {
  private serviceName: string
  private minLevel: LogLevel

  constructor(serviceName: string, minLevel: LogLevel = 'info') {
    this.serviceName = serviceName
    this.minLevel = minLevel
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.minLevel)
  }

  private createEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        service: this.serviceName,
        ...context
      },
      action: context?.action as string,
      userId: context?.userId as string,
      ip: context?.ip as string
    }
  }

  private formatEntry(entry: LogEntry): string {
    const { timestamp, level, message, context } = entry

    // Format based on environment
    if (process.env.NODE_ENV === 'development') {
      const contextStr = context ? ` ${JSON.stringify(context)}` : ''
      return `[${timestamp}] [${level.toUpperCase()}] [${this.serviceName}] ${message}${contextStr}`
    }

    // Production format - more concise
    return JSON.stringify(entry)
  }

  private logEntry(entry: LogEntry) {
    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      const method = entry.level === 'error' ? 'error' : 'log'
      console[method](this.formatEntry(entry))
    }

    // In production, you would send this to a logging service
    // if (process.env.NODE_ENV === 'production') {
    //   sendToLoggingService(entry)
    // }
  }

  debug(message: string, context?: Record<string, unknown>) {
    if (this.shouldLog('debug')) {
      this.logEntry(this.createEntry('debug', message, context))
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    if (this.shouldLog('info')) {
      this.logEntry(this.createEntry('info', message, context))
    }
  }

  warn(message: string, context?: Record<string, unknown>) {
    if (this.shouldLog('warn')) {
      this.logEntry(this.createEntry('warn', message, context))
    }
  }

  error(message: string, context?: Record<string, unknown>) {
    if (this.shouldLog('error')) {
      this.logEntry(this.createEntry('error', message, context))
    }
  }

  // Get logs for debugging (would be different in production)
  getLogs(): LogEntry[] {
    // This is simplified - in production you'd query a logging service
    return []
  }

  // Clear logs
  clear() {
    // In production, this would manage retention policies
  }
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  action?: string
  userId?: string
  ip?: string
  duration?: number
}

// Simple in-memory logger for development
// In production, this would integrate with a logging service
class Logger {
  private logs: LogEntry[] = []

  private createEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      action: context?.action as string,
      userId: context?.userId as string,
      ip: context?.ip as string
    }
  }

  private formatEntry(entry: LogEntry): string {
    const { timestamp, level, message, context } = entry

    // Format based on environment
    if (process.env.NODE_ENV === 'development') {
      const contextStr = context ? ` ${JSON.stringify(context)}` : ''
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`
    }

    // Production format - more concise
    return JSON.stringify(entry)
  }

  private logEntry(entry: LogEntry) {
    this.logs.push(entry)

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      const method = entry.level === 'error' ? 'error' : 'log'
      console[method](this.formatEntry(entry))
    }

    // In production, you would send this to a logging service
    // if (process.env.NODE_ENV === 'production') {
    //   sendToLoggingService(entry)
    // }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.logEntry(this.createEntry('debug', message, context))
  }

  info(message: string, context?: Record<string, unknown>) {
    this.logEntry(this.createEntry('info', message, context))
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.logEntry(this.createEntry('warn', message, context))
  }

  error(message: string, context?: Record<string, unknown>) {
    this.logEntry(this.createEntry('error', message, context))
  }

  // Get logs for debugging
  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  // Clear logs
  clear() {
    this.logs = []
  }
}

// Export singleton instance
export const log = new Logger()

// Performance monitoring
export function startAuthTimer() {
  const start = Date.now()
  return () => {
    const duration = Date.now() - start
    log.debug('Auth operation completed', { duration, action: 'auth_timer' })
    return duration
  }
}

export function startMiddlewareTimer() {
  const start = Date.now()
  return (action: string) => {
    const duration = Date.now() - start
    log.debug('Middleware operation completed', { action, duration })
    return duration
  }
}