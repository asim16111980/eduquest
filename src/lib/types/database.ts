// Auto-generated TypeScript types from Supabase schema
// Generated from data-model.md as fallback when Supabase CLI unavailable
// Last updated: 2026-05-24T18:11:49.035Z
//
// For production, run: supabase gen types typescript --local > this_file
// Or: supabase gen types typescript --project-id <project-id> --local

// Role enum matching Supabase roles
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  CONTENT_MANAGER = 'content_manager',
  TEACHER = 'teacher',
  VIEWER = 'viewer',
  STUDENT = 'student',
}

// Enum labels for UI display
export const ROLE_LABELS = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.CONTENT_MANAGER]: 'Content Manager',
  [UserRole.TEACHER]: 'Teacher',
  [UserRole.VIEWER]: 'Viewer',
  [UserRole.STUDENT]: 'Student',
}

// Role colors for UI display
export const ROLE_COLORS = {
  [UserRole.SUPER_ADMIN]: 'text-purple-600 bg-purple-100',
  [UserRole.CONTENT_MANAGER]: 'text-blue-600 bg-blue-100',
  [UserRole.TEACHER]: 'text-green-600 bg-green-100',
  [UserRole.VIEWER]: 'text-gray-600 bg-gray-100',
  [UserRole.STUDENT]: 'text-orange-600 bg-orange-100',
}

// Role hierarchy for access control
// Ordered from most to least privileged, so unknown roles default to least-privileged
export const ROLE_HIERARCHY = [
  UserRole.SUPER_ADMIN,
  UserRole.CONTENT_MANAGER,
  UserRole.TEACHER,
  UserRole.VIEWER,
  UserRole.STUDENT,
]

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  // Validate/canonicalize the incoming userRole against the UserRole enum
  const normalizedRole = Object.values(UserRole).includes(userRole)
    ? userRole
    : UserRole.STUDENT // Fallback to the least-privileged role if not found

  const userIndex = ROLE_HIERARCHY.indexOf(normalizedRole)
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole)
  return userIndex !== -1 && userIndex <= requiredIndex
}

// Type aliases for convenience - matches database tables

// Session state for React context
export interface SessionState {
  isLoading: boolean
  session: UserSession | null
  error: string | null
}

// Session context for React context
export interface SessionContext {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  session: UserSession | null
  loading: boolean
}

// Environment Configuration - stored in .env.local
export interface EnvironmentConfig {
  key: string
  value: string
  is_sensitive: boolean
  description?: string
  last_updated: string
}

// API Response types
export interface ApiResponse {
  data: unknown | null
  error: string | null
  status: number
}

export interface PaginatedResponse {
  data: unknown[]
  count: number
  page: number
  per_page: number
  total_pages: number
}

// Pagination params
export interface PaginationParams {
  page?: number
  per_page?: number
  sort?: string
  order?: 'asc' | 'desc'
}

// Query filters
export interface QueryFilter {
  field: string
  operator: 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'like' | 'ilike' | 'in' | 'is'
  value: unknown
}

// Define base types first
export interface UserProfile {
  id: string
  auth_user_id: string
  role: UserRole
  display_name: string
  avatar_url?: string
  grade_level?: string
  is_active: boolean
  created_at: string
  updated_at?: string
  deleted_at?: string
}

export interface UserSession {
  id: string
  user_id: string
  access_token: string
  refresh_token?: string
  expires_at: string
  created_at: string
  updated_at?: string
  deleted_at?: string
}

export interface AuditLog {
  id: string
  user_id?: string
  action: string
  resource_type: string
  resource_id: string
  changes?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  status: 'success' | 'failed' | 'pending'
  error_message?: string
  created_at: string
}

// Database type matching Supabase generated types structure
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>
      }
      user_sessions: {
        Row: UserSession
        Insert: Omit<UserSession, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<UserSession, 'id' | 'created_at'>>
      }
      audit_logs: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'created_at'>
        Update: Partial<Omit<AuditLog, 'id' | 'created_at'>>
      }
    }
    Functions: {
    }
    Enums: {
      role_enum: UserRole
    }
  }
  auth: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          email_confirmed_at: string | null
          phone: string | null
          phone_confirmed_at: string | null
          last_sign_in_at: string | null
          created_at: string
          updated_at: string
          role?: UserRole
        }
        Insert: {
          id?: string
          email: string
          email_confirmed_at?: string | null
          phone?: string | null
          phone_confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          email_confirmed_at?: string | null
          phone?: string | null
          phone_confirmed_at?: string | null
          last_sign_in_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Type aliases for convenience - references to the defined types
export type UserProfileInsert = Omit<UserProfile, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
export type UserProfileUpdate = Partial<Omit<UserProfile, 'id' | 'created_at'>>

export type UserSessionInsert = Omit<UserSession, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
export type UserSessionUpdate = Partial<Omit<UserSession, 'id' | 'created_at'>>

export type AuditLogInsert = Omit<AuditLog, 'id' | 'created_at'>
export type AuditLogUpdate = Partial<Omit<AuditLog, 'id' | 'created_at'>>

export type AuthUser = Database['auth']['Tables']['users']['Row']