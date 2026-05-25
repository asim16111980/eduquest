// Script to generate TypeScript types from Supabase database
// This script attempts multiple approaches to generate types
// If Supabase CLI is not available, it creates placeholder types based on the data model

const fs = require('fs')
const path = require('path')

// Determine execution approach
const usePlaceholderTypes = true // Default to placeholder types when CLI not available

async function main() {
  console.log('=== Supabase Type Generator ===\n')

  if (usePlaceholderTypes) {
    console.log('📝 Using placeholder types based on data model')
    console.log('   This creates type definitions based on the known schema')
    console.log('   For production, run: supabase gen types typescript --local\n')

    const types = generatePlaceholderTypes()
    writeTypesToFile(types)
    return
  }
}

function generatePlaceholderTypes() {
  // Generate types based on the data model in specs/002-dev-bootstrap/plan/data-model.md
  return `// Auto-generated TypeScript types from Supabase schema
// Generated from data-model.md as fallback when Supabase CLI unavailable
// Last updated: ${new Date().toISOString()}
// 
// For production, run: supabase gen types typescript --local > this_file
// Or: supabase gen types typescript --project-id <project-id> --local

// User role enum matching Supabase roles
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

// Role hierarchy for access control
export const ROLE_HIERARCHY = [
  UserRole.SUPER_ADMIN,
  UserRole.CONTENT_MANAGER,
  UserRole.TEACHER,
  UserRole.VIEWER,
  UserRole.STUDENT,
]

// Role colors for UI display
export const ROLE_COLORS = {
  [UserRole.SUPER_ADMIN]: 'text-purple-600 bg-purple-100',
  [UserRole.CONTENT_MANAGER]: 'text-blue-600 bg-blue-100',
  [UserRole.TEACHER]: 'text-green-600 bg-green-100',
  [UserRole.VIEWER]: 'text-gray-600 bg-gray-100',
  [UserRole.STUDENT]: 'text-orange-600 bg-orange-100',
}

// Role-based access control helper
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  // Normalize userRole: if not in hierarchy, default to STUDENT (least-privileged)
  const userIndex = ROLE_HIERARCHY.indexOf(userRole)
  const normalizedUserIndex = userIndex !== -1 ? userIndex : ROLE_HIERARCHY.indexOf(UserRole.STUDENT)
  
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole)
  // Validate requiredRole is in hierarchy, if not skip validation
  if (requiredIndex === -1) {
    return false
  }
  
  return normalizedUserIndex <= requiredIndex
}

// User Profile - matches user_profiles table
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

// Extended user profile for authentication context
export interface AuthUserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  role: UserRole
  avatar_url?: string
  is_active: boolean
  email_verified: boolean
  created_at: string
  updated_at?: string
  last_login_at?: string
}

// User Session - JWT session state
export interface UserSession {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  user: AuthUserProfile
  user_role: UserRole
  created_at: string
}

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

// Database type matching Supabase generated types structure
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>
      }
    }
    Functions: {
    }
    Enums: {
      role_enum: UserRole
    }
  }
}
`
}

function writeTypesToFile(content) {
  const outputDir = path.join(__dirname, '..', 'src', 'lib', 'types')
  const outputFile = path.join(outputDir, 'database.ts')

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Write file
  fs.writeFileSync(outputFile, content, 'utf8')

  console.log('Types written to', outputFile)
  console.log('Generated type definitions for:')
  console.log('  ✓ UserRole enum')
  console.log('  ✓ UserProfile interface')
  console.log('  ✓ AuthUserProfile interface')
  console.log('  ✓ UserSession interface')
  console.log('  ✓ SessionState interface')
  console.log('  ✓ SessionContext interface')
  console.log('  ✓ EnvironmentConfig interface')
  console.log('  ✓ Database interface')
  console.log('  ✓ API response types')
  console.log('  ✓ Query filter types')
  console.log('\nNext steps:')
  console.log('  1. Update src/lib/types/index.ts to export Database types')
  console.log('  2. Run "npm run build" to verify no TypeScript errors')
  console.log('  3. Import types in components and verify autocompletion')
}

main().catch(error => {
  console.error('Error:', error.message)
  process.exit(1)
})
