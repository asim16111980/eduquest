import type { UserProfile } from './user'

export interface UserSession {
  id: string
  userId: string
  createdAt: string
  expiresAt: string
  metadata: Record<string, unknown> | null
}

export interface SessionState {
  isLoading: boolean
  session: UserSession | null
  error: string | null
}

export interface SessionContext {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}