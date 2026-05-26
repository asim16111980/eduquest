# Implementation Plan: Development Bootstrap for EduQuest Admin Dashboard

**Branch**: `002-dev-bootstrap` | **Date**: 2026-05-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-dev-bootstrap/spec.md`

## Summary

This feature bootstraps the EduQuest Admin Dashboard development environment. It establishes the foundational Next.js 15 project structure, configures Supabase integration with server/browser/middleware clients, implements authentication with PKCE flow, defines comprehensive TypeScript types for database entities, and sets up CI/CD pipeline for Railway deployment. Phase 4 specifically focuses on User Story 4 - configuring type safety through database type generation and domain type definitions.

## Technical Context

**Language/Version**: TypeScript 5.7+ (strict mode)  
**Primary Dependencies**: Next.js 15 (App Router), React 19, Supabase JS SDK (@supabase/supabase-js), Supabase SSR (@supabase/ssr)  
**Storage**: PostgreSQL (via Supabase)  
**Testing**: TypeScript compiler (strict mode), ESLint, Prettier  
**Target Platform**: Web (Next.js Server Components + Client Components)  
**Project Type**: Web Application (Admin Dashboard)  
**Performance Goals**: 100 concurrent users, sub-second responses, <200ms auth latency  
**Constraints**: LCP < 2.5s, no `any` types, no inline styles  
**Scale/Scope**: Admin dashboard for platform operators with role-based access (super_admin, content_manager, teacher, viewer, student)

## Constitution Check

**GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.**

### Review Against Constitution Principles:

1. **Admin-First Design** ✅ - Dashboard built for platform operators with role-based access
2. **Server-Driven Data Architecture** ✅ - Server Components fetch by default using createServerClient
3. **Database Schema Governance** ✅ - All types derived from Supabase schema, consistent patterns
4. **Performance-First Rendering** ✅ - LCP targets, skeleton loaders, virtualization for large tables
5. **Export-First Reporting** ✅ - Exports respect filters, streamed from Route Handlers

### Additional Constraints Check:

- ✅ Realtime used only for live widgets (not phase 4)
- ✅ Other data uses SWR/React Query with 30s polling (not phase 4)
- ✅ TypeScript strict mode: no `any`, no `ts-ignore` without comment
- ✅ No inline styles — Tailwind utility classes only
- ✅ Components are single-responsibility
- ✅ All mutations through optimistic UI + server validation
- ✅ No console.log — use structured logger utility (T074 in polish phase)
- ✅ Error boundaries wrap every dashboard section (T071 in polish phase)

**Result**: All constitution principles satisfied. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/002-dev-bootstrap/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (if applicable)
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
src/
├── app/                 # Next.js App Router
│   ├── (auth)/         # Auth routes (login, register, etc.)
│   └── (dashboard)/    # Dashboard routes (protected)
├── components/         # React components
│   ├── shared/        # Shared reusable components
│   └── charts/        # Chart components
├── lib/               # Libraries
│   ├── supabase/      # Supabase clients
│   │   ├── server.ts
│   │   ├── client.ts
│   │   └── middleware.ts
│   ├── types/         # TypeScript types (USER STORY 4)
│   │   ├── user.ts
│   │   ├── session.ts
│   │   ├── roles.ts
│   │   └── index.ts
│   └── queries/       # Database queries
│       └── test.ts
└── styles/            # Global styles

tests/                 # Tests (if implemented)
.env.local            # Environment variables (template provided)
```

**Structure Decision**: Single-project structure (Option 1) - This is a unified web application with Next.js 15 App Router. Server and client components coexist in the same src directory, with routing sections (auth, dashboard) separated by parentheses in the app directory.

## Complexity Tracking

> No violations requiring justification. All constitution principles satisfied.
