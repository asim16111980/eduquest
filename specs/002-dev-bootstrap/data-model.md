# Data Model: Development Bootstrap for EduQuest Admin Dashboard

**Branch**: `002-dev-bootstrap`  
**Date**: 2026-05-25  
**Context**: Entity definitions for Supabase database tables and domain types

---

## Database Tables (Supabase Schema)

### auth.users
**Purpose**: Supabase Auth user records

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PRIMARY KEY, NOT NULL |
| email | text | UNIQUE, NOT NULL |
| encrypted_password | text | NOT NULL |
| email_confirmed_at | timestamptz | |
| created_at | timestamptz | DEFAULT NOW() |
| updated_at | timestamptz | |
| raw.AppMetadata | jsonb | |
| raw.UserMetadata | jsonb | |

**Notes**: Supabase manages this table automatically. We reference it for user relationships.

---

### public.user_profiles
**Purpose**: Extended user information beyond auth data

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE |
| role | text | NOT NULL, DEFAULT 'viewer' |
| display_name | text | |
| avatar_url | text | |
| created_at | timestamptz | DEFAULT NOW() |
| updated_at | timestamptz | |

**Notes**: One-to-one with auth.users. Stores domain-specific user attributes.

---

### public.user_sessions
**Purpose**: Active sessions for tracking and analytics (optional, can be derived from auth.sessions)

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PRIMARY KEY |
| user_id | uuid | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE |
| created_at | timestamptz | DEFAULT NOW() |
| expires_at | timestamptz | NOT NULL |
| metadata | jsonb | |

**Notes**: Can be derived from Supabase Auth sessions, but explicit table allows custom schema.

---

### public.audit_logs
**Purpose**: Track user actions for compliance and debugging

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PRIMARY KEY |
| user_id | uuid | REFERENCES auth.users(id) ON DELETE SET NULL |
| action | text | NOT NULL |
| entity_type | text | |
| entity_id | uuid | |
| details | jsonb | |
| created_at | timestamptz | DEFAULT NOW() |

**Notes**: Audit trail for all significant user actions.

---

## Domain Types (TypeScript Interfaces)

### UserProfile

```typescript
export interface UserProfile {
  id: string // uuid
  userId: string // uuid from auth.users
  role: UserRole
  displayName: string | null
  avatarUrl: string | null
  createdAt: string // timestamptz
  updatedAt: string // timestamptz
}
```

**Notes**: Domain representation of user_profiles table. Uses string for uuid/timestamptz.

---

### UserSession

```typescript
export interface UserSession {
  id: string // uuid
  userId: string // uuid from auth.users
  createdAt: string // timestamptz
  expiresAt: string // timestamptz
  metadata: Record<string, unknown> | null
}
```

**Notes**: Domain representation of user_sessions table.

---

### UserRole

```typescript
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  CONTENT_MANAGER = 'content_manager',
  TEACHER = 'teacher',
  VIEWER = 'viewer',
  STUDENT = 'student',
}
```

**Notes**: Enum for role-based access control. Values match database text values.

---

## Entity Relationships

```
auth.users (Supabase Auth)
    1─────1 public.user_profiles
    1─────* public.user_sessions (optional)
    1─────* public.audit_logs
```

**Notes**: 
- One-to-one between auth.users and user_profiles
- One-to-many between users and sessions
- One-to-many between users and audit logs (optional)

---

## Validation Rules

### UserProfile
- `userId`: Must exist in auth.users (foreign key constraint)
- `role`: Must be one of UserRole enum values
- `displayName`: Optional, max 100 characters
- `avatarUrl`: Optional, must be valid URL if provided

### UserSession
- `userId`: Must exist in auth.users (foreign key constraint)
- `expiresAt`: Must be in the future (application-level validation)

### AuditLogs
- `action`: Required, max 100 characters
- `entityType`: Optional, max 100 characters
- `entityId`: Optional, must be valid UUID if provided
- `details`: Optional, must be valid JSON if provided

---

## State Transitions

### UserRole Transitions
```
student → teacher → content_manager → super_admin
```

**Notes**: Roles can only be upgraded, not downgraded (application logic). Super admins can reset any role.
