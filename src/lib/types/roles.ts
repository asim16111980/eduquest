import { UserRole } from './user'

export const ROLE_HIERARCHY: UserRole[] = [
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
    : UserRole.VIEWER // Fallback to the least-privileged role if not found

  const userIndex = ROLE_HIERARCHY.indexOf(normalizedRole)
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