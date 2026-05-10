# Data Model: Database Bootstrap Phase 0A

**Date**: 2026-05-10  
**Feature**: Database Bootstrap Phase 0A  
**Branch**: 001-db-bootstrap

## Core Entities

### 1. Supabase Project

The central entity representing the PostgreSQL instance with integrated services.

**Attributes**:
- `id` (UUID, Primary Key) - Project identifier
- `name` (String) - Project name (e.g., "eduquest-admin")
- `region` (String) - Deployment region (e.g., "us-east-1")
- `plan` (String) - Subscription plan (e.g., "free")
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp
- `status` (String) - Project status (e.g., "active", "creating")

### 2. Environment Configuration

Stores configuration for Railway deployment and local development.

**Attributes**:
- `id` (UUID, Primary Key) - Configuration ID
- `project_id` (UUID, Foreign Key) - References Supabase Project
- `variable_name` (String) - Environment variable name
- `variable_value` (String) - Environment variable value
- `environment` (String) - Target environment ("production", "development")
- `is_sensitive` (Boolean) - Whether the value is secret
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

### 3. Security Policy

Defines Row Level Security rules for database tables.

**Attributes**:
- `id` (UUID, Primary Key) - Policy ID
- `table_name` (String) - Target table name
- `policy_name` (String) - Human-readable policy name
- `policy_type` (String) - Policy type ("SELECT", "INSERT", "UPDATE", "DELETE")
- `definition` (Text) - SQL policy definition
- `is_enabled` (Boolean) - Whether policy is active
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

### 4. Authentication Configuration

Stores authentication settings for the Supabase project.

**Attributes**:
- `id` (UUID, Primary Key) - Config ID
- `site_url` (String) - Allowed site URL
- `redirect_urls` (Text[]) - Allowed redirect URLs
- `providers` (JSONB) - Authentication provider settings
- `pkce_enabled` (Boolean) - Whether PKCE flow is enabled
- `session_settings` (JSONB) - Session configuration
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

### 5. Realtime Configuration

Defines Realtime subscriptions for specific tables.

**Attributes**:
- `id` (UUID, Primary Key) - Config ID
- `table_name` (String) - Table to monitor
- `event_types` (Text[]) - Event types to broadcast ("INSERT", "UPDATE", "DELETE")
- `is_enabled` (Boolean) - Whether Realtime is enabled
- `permissions` (JSONB) - Access permissions for the channel
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

## Required Tables for Phase 0A

Based on the feature specification, the following tables need to be considered:

### Core Tables (to be created in future migrations)
1. **`users`** - User accounts with role hierarchy
2. **`activities`** - User activity tracking
3. **`leaderboard_snapshots`** - Periodic leaderboard data
4. **`activity_logs`** - Detailed audit log

### System Tables (automatically created by Supabase)
- `auth.users` - Authentication user data
- `auth.sessions` - User session data
- `storage.objects` - File storage objects
- `realtime.messages` - Realtime message history

## Schema Patterns

All future tables MUST follow this pattern:

```sql
CREATE TABLE table_name (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ NULL
);
```

## Relationships

```
Supabase Project
├── Environment Configuration (1:many)
├── Security Policy (1:many)
├── Authentication Configuration (1:1)
└── Realtime Configuration (1:many)
```

## Validation Rules

1. **Environment Variables**: All sensitive values must be encrypted at rest
2. **Security Policies**: Default deny policy must be enabled on all tables
3. **Auth Configuration**: Site URL must match Railway domain
4. **Realtime**: Only specified tables can have Realtime enabled

## Future Considerations

1. **Soft Deletes**: All tables will use `deleted_at` for soft delete pattern
2. **Audit Logging**: `activity_logs` will track all significant operations
3. **Performance**: Leaderboard snapshots will be pre-computed
4. **Security**: All access through Row Level Security policies