import { UserProfile } from './user'

export interface UserSession {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  user: UserProfile
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