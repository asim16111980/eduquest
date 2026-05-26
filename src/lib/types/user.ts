// UserRole is exported from roles.ts
import { UserRole } from './roles'

export interface UserProfile {
  id: string
  userId: string
  role: UserRole
  displayName: string | null
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthUser {
  id: string
  email: string
  encryptedPassword: string | null
  emailConfirmedAt: string | null
  createdAt: string
  updatedAt: string
  appMetadata: Record<string, unknown>
  userMetadata: Record<string, unknown>
}

// Re-export UserRole for convenience
export { UserRole }