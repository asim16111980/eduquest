# Research: Development Bootstrap for EduQuest Admin Dashboard

**Feature Branch**: `002-dev-bootstrap`  
**Date**: 2026-05-25  
**Context**: Establishing foundational project structure, Supabase integration, authentication, type safety, and CI/CD pipeline

---

## Phase 4: Type Safety Research (User Story 4)

### Decision: Generate TypeScript Types from Supabase Schema

**What**: Use Supabase CLI to automatically generate TypeScript types from the PostgreSQL schema, then define domain-specific TypeScript interfaces for business entities.

**Rationale**:
- Supabase CLI's `gen types typescript` command leverages the actual database schema to generate accurate type definitions
- Domain types (UserProfile, UserSession, UserRole) provide semantic meaning beyond raw database tables
- Separating database types from domain types allows for type transformations and validation
- TypeScript strict mode requires explicit types for all function parameters, return values, and component props

**Alternatives Considered**:
1. **Hand-written types only** - Rejected because it's error-prone and doesn't leverage schema changes
2. **Direct database types only** - Rejected because domain types provide business context and validation
3. **GraphQL Code Generator** - Rejected because Supabase doesn't use GraphQL, and the Supabase CLI solution is simpler
4. **Zod schemas** - Rejected for Phase 4 because the spec requires TypeScript types first; Zod can be added later for runtime validation

### Decision: Domain Types Directory Structure

**What**: Create `src/lib/types/` directory with separate files per entity:
- `user.ts` - UserProfile interface
- `session.ts` - UserSession interface
- `roles.ts` - UserRole enum
- `index.ts` - Barrel exports

**Rationale**:
- Small files are easier to maintain and locate
- Barrel exports (`index.ts`) simplify imports: `import type { UserProfile, UserRole } from '@/lib/types'`
- Separating types by entity aligns with Supabase table structure
- The `lib/types` directory follows the existing project structure (lib/supabase, lib/queries)

**Alternatives Considered**:
1. **Single types file** - Rejected because it becomes unmanageable as more types are added
2. **Types alongside components** - Rejected because types are shared across multiple components
3. **Types in a separate package** - Rejected because it adds complexity for this bootstrapping phase

---

## Phase 0 & 1: Foundation Research (Users Stories 1-3)

### Decision: Next.js 15 with App Router

**What**: Initialize Next.js 15 project with App Router (not Pages Router), TypeScript strict mode, and Tailwind CSS 3.4.

**Rationale**:
- Next.js 15 is the latest stable version with App Router (React Server Components)
- App Router provides better performance, streaming, and nested layouts
- TypeScript strict mode catches errors early and improves developer experience
- Tailwind CSS 3.4 is stable and integrates well with Next.js via PostCSS

### Decision: Supabase Client Helpers Pattern

**What**: Create three distinct client helpers: `createServerClient`, `createBrowserClient`, and `createMiddlewareClient`.

**Rationale**:
- Different execution contexts require different Supabase initialization:
  - Server: Uses cookie session storage, server-side session refresh
  - Browser: Uses localStorage session storage, client-side session refresh
  - Middleware: Reads cookies without full Supabase client, validates sessions
- This pattern is documented in Supabase SSR package and ensures consistent session management across contexts

**Alternatives Considered**:
1. **Single client instance** - Rejected because cookies don't work in middleware, and localStorage isn't available on server
2. **Dynamic client creation per request** - Rejected because it adds overhead and complexity
3. **Context provider for Supabase** - Rejected because middleware can't use React Context

### Decision: PKCE Flow for Authentication

**What**: Implement authentication with PKCE (Proof Key for Code Exchange) flow, not simple password authentication.

**Rationale**:
- PKCE is the recommended OAuth 2.0 flow for public clients (browser apps)
- It prevents authorization code interception attacks
- Supabase Auth supports PKCE out of the box with `signInWithOAuth({ provider, options: { authProvider: 'github' } })`
- For email/password, Supabase's `auth.signInWithPassword()` handles PKCE internally

**Alternatives Considered**:
1. **Magic link authentication** - Rejected because it adds friction to the login flow
2. **Third-party OAuth only** - Rejected because the spec requires email/password support
3. **JWT tokens stored in localStorage** - Rejected because it's less secure than Supabase's encrypted cookies

### Decision: Middleware Client for Session Validation

**What**: Create a middleware client that reads Supabase session cookies and validates them without creating a full Supabase client.

**Rationale**:
- Next.js Middleware runs on every request, so it must be lightweight
- Full Supabase client initialization is too slow for middleware
- The middleware client only needs to parse the JWT and validate the signature
- This pattern is documented in Supabase documentation for protecting dashboard routes

**Implementation**:
```typescript
// Middleware client extracts session from cookie and validates JWT signature
// without creating a full Supabase client (no HTTP calls)
```

---

## Phase 2: CI/CD and Deployment Research (User Story 5)

### Decision: GitHub Actions for CI Pipeline

**What**: Configure GitHub Actions to run linting, type checking, and build on every PR to main.

**Rationale**:
- GitHub Actions is integrated with the repository (no additional setup)
- YAML configuration is version-controlled
- Free tier supports public repositories and sufficient minutes for private repos
- Workflow can trigger Railway deployment on merge to main

### Decision: Railway for Deployment

**What**: Deploy to Railway (
)

