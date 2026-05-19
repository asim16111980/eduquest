# Implementation Plan: Development Bootstrap for EduQuest Admin Dashboard

**Feature Branch**: `002-dev-bootstrap`  
**Created**: 2026-05-18  
**Status**: Planning  
**Based on**: `specs/002-dev-bootstrap/spec.md`

---

## Technical Context

### Technology Stack
- **Frontend**: Next.js 15 with App Router, TypeScript strict mode, Tailwind v4
- **Backend**: Next.js Route Handlers, server-side logic only
- **Database**: Supabase (PostgreSQL) with RLS policies
- **Auth**: Supabase Auth with PKCE flow
- **Deployment**: Railway auto-deployment
- **CI/CD**: GitHub Actions (lint → typecheck → build)

### Key Dependencies
- `@supabase/supabase-js` - Database client
- `@supabase/auth-helpers-nextjs` - Authentication helpers
- `typescript` - Type checking
- `eslint` - Code linting
- `prettier` - Code formatting
- `tailwindcss` - Styling
- `@next/bundle-analyzer` - Bundle size optimization

### External Integrations
- Supabase services (database, auth, realtime)
- Railway deployment platform
- GitHub repository (for CI/CD)

### Known Constraints
- Must use exact stack specified in Constitution §2: Next.js 15, TypeScript strict, Tailwind v4
- All schema changes through migrations
- No `any` types in TypeScript
- No inline styles - Tailwind utility classes only
- Performance targets: LCP < 2.5s, 100 concurrent users
- Error handling: user-friendly messages with structured technical logging
- Realtime usage limited to leaderboard widgets, active-user counter, live event feed
- All exports respect current filter state and are streamed server-side

### Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Admin-First Design | ✅ | Role-based access control implemented |
| Server-Driven Data Architecture | ✅ | Server Components with createServerClient |
| Database Schema Governance | ✅ | All changes through migrations |
| Performance-First Rendering | ✅ | Skeleton loaders, performance targets defined |
| Export-First Reporting | ❓ | Not applicable for bootstrap phase |
| Additional Constraints | ✅ | TypeScript strict, no inline styles, error boundaries |
| Development Workflow | ✅ | CI pipeline configured, code review required |

**Constitution Compliance**: All applicable principles satisfied. No violations.

---

## Phase 0: Research & Dependencies

### Research Tasks

#### Task R-001: Next.js 15 Best Practices
**Objective**: Research Next.js 15 App Router patterns for admin dashboards
- Study server component patterns for data fetching
- Research middleware implementation for auth
- Analyze optimal TypeScript configuration
- Document performance optimization techniques

#### Task R-002: Supabase Integration Patterns
**Objective**: Research Supabase client implementations for Next.js
- Best practices for server vs client client configuration
- PKCE flow implementation details
- Session management with Supabase Auth
- Error handling for connection failures

#### Task R-003: Railway Deployment Configuration
**Objective**: Research Railway deployment for Next.js apps
- Environment variable setup
- Build configuration optimization
- Auto-deployment triggers
- Performance monitoring setup

#### Task R-004: TypeScript Strict Mode Implementation
**Objective**: Research TypeScript strict mode best practices
- Type generation from Supabase schema
- Domain type patterns
- Avoiding `any` types
- Path alias configuration

#### Task R-005: CI/CD Pipeline Patterns
**Objective**: Research GitHub Actions for Next.js projects
- Optimal workflow steps order
- Caching strategies for dependencies
- Build and test matrix
- Security scanning integration

### Research Consolidation

**Decision**: Use official Supabase Auth helpers with Next.js
**Rationale**: Maintains compatibility with Supabase services while providing proper TypeScript support
**Alternatives considered**: Custom auth implementation, third-party auth libraries

**Decision**: Railway auto-deployment with native Next.js buildpack
**Rationale**: Simplifies deployment process, leverages Railway's optimized Next.js support
**Alternatives considered**: Docker deployment, custom build scripts

**Decision**: GitHub Actions CI with caching
**Rationale**: Reduces build times while maintaining comprehensive checks
**Alternatives considered**: CircleCI, Travis CI, no CI (not acceptable)

**Decision**: TypeScript strict mode with path aliases
**Rationale**: Improves developer experience with better autocomplete and type safety
**Alternatives considered**: Loose TypeScript, no path aliases

---

## Phase 1: Data Model & Contracts

### Data Model (`data-model.md`)

#### Core Entities

1. **User Profile**
   - `id` UUID (PK) - linked to auth.users
   - `auth_user_id` UUID - FK to auth.users
   - `role` ENUM - super_admin, content_manager, teacher, viewer, student
   - `display_name` TEXT
   - `avatar_url` TEXT (nullable)
   - `grade_level` TEXT (nullable)
   - `is_active` BOOLEAN
   - `created_at` TIMESTAMPTZ
   - `updated_at` TIMESTAMPTZ
   - `deleted_at` TIMESTAMPTZ (nullable)

2. **User Session**
   - JWT token with role claims
   - Expiration timestamp
   - Refresh token (handled by Supabase)

3. **Environment Configuration**
   - `SUPABASE_URL` - Database endpoint
   - `SUPABASE_ANON_KEY` - Public API key
   - `SUPABASE_SERVICE_ROLE_KEY` - Admin key (server-only)
   - `NEXTAUTH_URL` - Application URL

4. **Type Definitions**
   - Database types (generated from Supabase)
   - Domain types (custom business entities)
   - API response types

#### Validation Rules
- Email format validation for login
- Role-based access control at all levels
- UUID identifiers for all entities
- Soft delete pattern for all entities

#### State Transitions
- User: active → inactive (via admin action)
- Session: valid → expired (time-based)
- Environment: configured → missing (error state)

### Interface Contracts

Since this is an internal admin dashboard with no external APIs, no formal interface contracts are needed. All functionality is internal to the application.

### Quickstart (`quickstart.md`)

```markdown
# EduQuest Admin Dashboard - Development Bootstrap

## Prerequisites
- Node.js 20+
- npm
- Supabase CLI
- Railway account

## Setup Steps

### 1. Initialize Next.js App
```bash
npx create-next-app@latest eduquest-admin --typescript --tailwind --app --src-dir --import-alias "@/*"
cd eduquest-admin
```

### 2. Install Dependencies
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### 3. Configure Environment
Create `.env.local`:
```
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### 4. Setup TypeScript
Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 5. Configure Supabase Clients
Create `lib/supabase/` with server, client, and middleware implementations.

### 6. Test Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## Next Steps
1. Set up authentication middleware
2. Configure type generation
3. Set up CI/CD pipeline
```

---

## Phase 2: Implementation Strategy

### Implementation Order

1. **BE-001**: Project scaffold and dependencies
   - Initialize Next.js 15 app
   - Install all dependencies
   - Configure TypeScript path aliases
   - Set up ESLint + Prettier

2. **BE-002**: Supabase client helpers
   - Create `createServerClient`
   - Create `createBrowserClient`
   - Create `createMiddlewareClient`

3. **BE-003**: Auth middleware
   - Session validation
   - Role-based redirects
   - Request header attachment

4. **BE-004**: TypeScript types
   - Generate database types
   - Define domain types
   - Update type references

5. **BE-005**: GitHub Actions CI
   - Configure workflow
   - Set up auto-deployment
   - Add performance monitoring

6. **BE-006**: Railway Deployment Pipeline
   - Configure Railway environment variables
   - Set up auto-deployment triggers
   - Configure health checks and monitoring
   - Implement deployment rollback strategy

6. **BE-006**: Error handling
   - User-friendly messages
   - Technical logging
   - Graceful degradation

7. **BE-007**: Performance optimization
   - Code splitting
   - Bundle optimization
   - Caching strategies

### Success Metrics

- Development setup time < 10 minutes
- Build success rate: 100%
- TypeScript errors: 0
- Authentication latency: < 200ms
- CI pipeline success rate: 100%
- Railway deployment time: < 5 minutes

### Risk Mitigation

1. **Dependency conflicts**
   - Use exact versions from package.json
   - Test all combinations

2. **TypeScript errors**
   - Strict mode from start
   - Incremental type adoption

3. **Authentication issues**
   - Test all role scenarios
   - Mock Supabase for development

4. **Performance issues**
   - Monitor bundle size
   - Profile on deployment

---

## Agent Context Update

<!-- SPECKIT START -->
Plan reference: `specs/002-dev-bootstrap/plan/implementation-plan.md`
<!-- SPECKIT END -->

---

## Generated Artifacts

1. **research.md** - Research findings and decisions
2. **data-model.md** - Entity definitions and relationships
3. **quickstart.md** - Setup instructions for developers
4. **contracts/** - (empty, no external interfaces)
5. **Implementation Plan** - This document

**Next Steps**: Run `/speckit-tasks` to generate actionable tasks from this plan.