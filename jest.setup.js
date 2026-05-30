// Jest setup file

// Import Jest DOM matchers
import '@testing-library/jest-dom'

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_ANON_KEY = 'test-anon-key'
process.env.NODE_ENV = 'test'

// Mock console methods in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}

// Suppress unhandled error warnings during tests
beforeAll(() => {
  const originalError = console.error
  console.error = (...args) => {
    // Don't log errors from error boundaries (they're intentional)
    if (!args.some(arg =>
      typeof arg === 'string' &&
      arg.includes('Error caught by boundary')
    )) {
      originalError.call(console, ...args)
    }
  }
})