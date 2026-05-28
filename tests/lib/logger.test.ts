import { StructuredLogger, log } from '@/lib/logger'

describe('StructuredLogger', () => {
  let logger: StructuredLogger
  let consoleSpy: jest.SpyInstance

  beforeEach(() => {
    logger = new StructuredLogger('test-service', 'debug')
    consoleSpy = jest.spyOn(console, 'debug').mockImplementation()
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('debug', () => {
    it('should log debug messages', () => {
      logger.debug('Test debug message', { userId: '123' })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] [test-service] Test debug message')
      )
    })

    it('should include metadata in log', () => {
      const meta = { userId: '123', action: 'login' }
      logger.debug('Test message', meta)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('{"userId":"123","action":"login"}')
      )
    })
  })

  describe('info', () => {
    it('should log info messages', () => {
      const infoSpy = jest.spyOn(console, 'info').mockImplementation()
      logger.info('Test info message')

      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] [test-service] Test info message')
      )
      infoSpy.mockRestore()
    })
  })

  describe('warn', () => {
    it('should log warn messages', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation()
      logger.warn('Test warn message')

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] [test-service] Test warn message')
      )
      warnSpy.mockRestore()
    })
  })

  describe('error', () => {
    it('should log error messages', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation()
      logger.error('Test error message')

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] [test-service] Test error message')
      )
      errorSpy.mockRestore()
    })
  })

  describe('level filtering', () => {
    it('should not log messages below min level', () => {
      const warnLogger = new StructuredLogger('test', 'warn')
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation()

      warnLogger.debug('This should not be logged')

      expect(debugSpy).not.toHaveBeenCalled()
      debugSpy.mockRestore()
    })
  })
})

describe('Convenience log functions', () => {
  let consoleSpy: jest.SpyInstance

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'info').mockImplementation()
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('should log using convenience functions', () => {
    log.info('Test message', { userId: '123' })

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[INFO] [eduquest] Test message')
    )
  })
})