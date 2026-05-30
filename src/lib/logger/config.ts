import type { LogLevel } from './index'

export interface LoggerConfig {
  serviceName: string
  minLevel: LogLevel
  enableConsole: boolean
  enableStructuredOutput: boolean
}

export const defaultLoggerConfig: LoggerConfig = {
  serviceName: 'eduquest',
  minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  enableConsole: true,
  enableStructuredOutput: true
}

export const getLoggerConfig = (): LoggerConfig => {
  return {
    ...defaultLoggerConfig,
    minLevel: (process.env.LOG_LEVEL as LogLevel) || defaultLoggerConfig.minLevel
  }
}