# Feature Specification: Database Bootstrap Phase 0A

**Feature Branch**: `001-db-bootstrap`  
**Created**: 2026-05-10  
**Status**: Draft  
**Input**: User description: "@docs/implementation-plan.md create a spec for phase 0A ONLY."

## Clarifications

### Session 2026-05-10

- Q: What Railway domain should be used for site URL configuration? → A: eduquest-admin.railway.app
- Q: Which Supabase region and plan should be used? → A: US region, free tier
- Q: What happens if Supabase project creation fails? → A: Auto-retry 3 times, then fail with clear error message and manual recreation steps
- Q: How are API keys rotated/refreshed if compromised? → A: Rotate keys and systematically update all environment variables and documentation
- Q: What happens if RLS enablement fails on specific tables? → A: Skip specific problematic tables and document the exception for future migration

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Setup Supabase Project (Priority: P1)

Platform administrator needs to initialize a new Supabase project for the EduQuest admin dashboard to establish the database foundation.

**Why this priority**: This is the foundational step that must complete before any other development can begin. No backend or frontend work can proceed without a working Supabase instance.

**Independent Test**: The project is ready when all connection strings and API keys are documented, and the CLI can successfully link to the project.

**Acceptance Scenarios**:

1. **Given** no Supabase project exists, **When** administrator creates a new project, **Then** project is created with default settings
2. **Given** project exists, **When** administrator views project settings, **Then** connection strings and API keys are visible and documented
3. **Given** project is created, **When** administrator runs `supabase link`, **Then** CLI successfully connects to the project

---

### User Story 2 - Configure Security Settings (Priority: P1)

Platform administrator needs to configure global security policies including Row Level Security (RLS) and authentication settings to ensure data protection.

**Why this priority**: Security is a non-negotiable requirement that must be established before any data is stored or users are authenticated.

**Independent Test**: Security is properly configured when RLS is enabled globally with default deny, and Auth is configured with email/password only using PKCE flow.

**Acceptance Scenarios**:

1. **Given** Supabase project exists, **When** administrator enables RLS, **Then** all tables have default deny policy
2. **Given** RLS is enabled, **When** administrator checks table policies, **Then** no table allows unrestricted access
3. **Given** project is configured, **When** administrator sets up Auth, **Then** only email/password authentication is enabled
4. **Given** Auth is configured, **When** administrator sets site URL, **Then** it matches `eduquest-admin.railway.app`

---

### User Story 3 - Enable Realtime Features (Priority: P2)

Platform administrator needs to configure Realtime for specific tables to support live widgets in the admin dashboard.

**Why this priority**: Realtime is required for key dashboard features like leaderboards and activity feeds, but can be configured after basic security is in place.

**Independent Test**: Realtime is working when the `activity_logs` and `leaderboard_snapshots` tables can broadcast changes in real-time.

**Acceptance Scenarios**:

1. **Given** project is initialized, **When** administrator enables Realtime, **Then** service is enabled for the project
2. **Given** Realtime is enabled, **When** administrator configures tables, **Then** `activity_logs` table can broadcast changes
3. **Given** Realtime is configured, **When** administrator configures tables, **Then** `leaderboard_snapshots` table can broadcast changes

---

### User Story 4 - Store Configuration Securely (Priority: P2)

Platform administrator needs to store all keys and credentials in environment variables to ensure secure deployment.

**Why this priority**: Hardcoded keys are a security risk. Environment variables are required for production deployment.

**Independent Test**: Configuration is secure when all sensitive data is stored in Railway environment variables and `.env.local`, with nothing committed to version control.

**Acceptance Scenarios**:

1. **Given** project has API keys, **When** administrator adds keys to Railway, **Then** keys are available as environment variables
2. **Given** keys exist in Railway, **When** administrator updates `.env.local`, **Then** all connection strings are present
3. **Given** configuration is complete, **When** administrator checks git status, **Then** `.env.local` is not committed to version control

---

### Edge Cases

- What happens if Supabase project creation fails? System auto-retries 3 times, then fails with clear error message and manual recreation steps
- How are API keys rotated/refreshed if compromised? Keys are rotated and all environment variables and documentation are systematically updated
- What happens if RLS enablement fails on specific tables? Skip specific problematic tables and document the exception for future migration

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST create a new Supabase project with default PostgreSQL configuration
- **FR-002**: System MUST enable Row Level Security (RLS) globally with default deny on all tables
- **FR-003**: System MUST configure email/password authentication only with PKCE flow
- **FR-004**: System MUST set site URL to `eduquest-admin.railway.app` for callback URLs
- **FR-005**: System MUST enable Realtime for `activity_logs` and `leaderboard_snapshots` tables only
- **FR-006**: System MUST store all connection strings and API keys in Railway environment variables
- **FR-007**: System MUST configure `.env.local` with all required credentials
- **FR-008**: System MUST verify `supabase` CLI is linked to the project (`supabase link` command succeeds)
- **FR-009**: System MUST NOT commit any API keys or credentials to version control
- **FR-010**: System MUST provide documentation of all connection strings and keys for development use

### Key Entities *(include if feature involves data)*

- **Supabase Project**: The cloud PostgreSQL instance with Auth, Realtime, and storage services
- **Environment Variables**: Railway configuration for sensitive data (API keys, connection strings)
- **RLS Policies**: Security rules that define access permissions for database tables
- **Auth Configuration**: Email/password setup with PKCE flow for secure authentication

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Supabase project creation completes within 5 minutes
- **SC-002**: All RLS policies are enabled globally within 2 minutes of project creation
- **SC-003**: Auth configuration validates successfully with test login
- **SC-004**: Realtime subscription works for both `activity_logs` and `leaderboard_snapshots` tables
- **SC-005**: `supabase link` command succeeds on first attempt
- **SC-006**: All environment variables are properly set in Railway dashboard
- **SC-007**: Local development environment can connect to remote Supabase instance
- **SC-008**: No sensitive data is committed to version control (verified by git status)

## Assumptions

- Railway platform is available and configured for deployment
- Supabase project will be deployed in US region using free tier plan
- Supabase CLI is installed and authenticated on development machine
- Project uses `eduquest-admin.railway.app` as the production domain for callback URLs
- Email/password authentication is sufficient for admin dashboard (social logins are explicitly not required)
- Only two tables require Realtime: `activity_logs` and `leaderboard_snapshots`
- Standard entity tables will follow the pattern: `id UUID`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`, `deleted_at TIMESTAMPTZ`
- Soft deletes will be used for all user-facing data via deleted_at column
- All schema changes will go through numbered migration files in the future