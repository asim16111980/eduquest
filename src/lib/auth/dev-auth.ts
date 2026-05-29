/**
 * Development authentication utilities
 * Used when Supabase is not configured or for testing
 */

export interface DevUser {
  id: string
  email: string
  name: string
  role: 'super_admin' | 'content_manager' | 'teacher' | 'viewer' | 'student'
}

// Mock users for development
const mockUsers: DevUser[] = [
  {
    id: '1',
    email: 'admin@eduquest.com',
    name: 'Admin User',
    role: 'super_admin'
  },
  {
    id: '2',
    email: 'teacher@eduquest.com',
    name: 'Teacher User',
    role: 'teacher'
  },
  {
    id: '3',
    email: 'student@eduquest.com',
    name: 'Student User',
    role: 'student'
  }
]

export function getMockUser(email: string, password: string): DevUser | null {
  // For development, accept any non-empty email and password
  if (email && password) {
    // Return a mock user based on email
    if (email.includes('admin')) {
      return mockUsers[0]
    } else if (email.includes('teacher')) {
      return mockUsers[1]
    } else if (email.includes('student')) {
      return mockUsers[2]
    }
    // Default to student user for any other email
    return mockUsers[2]
  }
  return null
}

export function createMockSession(user: DevUser) {
  return {
    user,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    token: `mock-token-${user.id}-${Date.now()}`
  }
}

export function verifyMockSession(token: string): DevUser | null {
  // Simple mock verification
  if (token.startsWith('mock-token-')) {
    const userId = token.split('-')[2]
    return mockUsers.find(u => u.id === userId) || null
  }
  return null
}