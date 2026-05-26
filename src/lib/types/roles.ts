// UserRole enum - must be defined independently since it's used by other types
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  CONTENT_MANAGER = 'content_manager',
  TEACHER = 'teacher',
  VIEWER = 'viewer',
  STUDENT = 'student',
}

export const ROLE_HIERARCHY: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.CONTENT_MANAGER,
  UserRole.TEACHER,
  UserRole.VIEWER,
  UserRole.STUDENT,
]

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole)
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole)
  return userIndex <= requiredIndex
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.CONTENT_MANAGER]: 'Content Manager',
  [UserRole.TEACHER]: 'Teacher',
  [UserRole.VIEWER]: 'Viewer',
  [UserRole.STUDENT]: 'Student',
}

export const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'text-purple-600 bg-purple-100',
  [UserRole.CONTENT_MANAGER]: 'text-blue-600 bg-blue-100',
  [UserRole.TEACHER]: 'text-green-600 bg-green-100',
  [UserRole.VIEWER]: 'text-gray-600 bg-gray-100',
  [UserRole.STUDENT]: 'text-orange-600 bg-orange-100',
}