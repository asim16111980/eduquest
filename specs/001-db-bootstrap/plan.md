# Implementation Plan: Database Bootstrap Phase 0A

**Branch**: `001-db-bootstrap` | **Date**: 2026-05-10 | **Spec**: link
**Input**: Feature specification from `/specs/001-db-bootstrap/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Initialize a Supabase project for EduQuest admin dashboard with security-first configuration including RLS, email/password authentication, and Realtime for activity tracking. Establish foundation for platform with secure credential management on Railway.

## Technical Context

**Language/Version**: Node.js 18+ / TypeScript 5.0+  
**Primary Dependencies**: Supabase CLI, Supabase client library, Railway CLI  
**Storage**: Supabase PostgreSQL (US region, free tier)  
**Testing**: Manual verification via CLI and dashboard checks  
**Target Platform**: Railway deployment (eduquest-admin.railway.app)  
**Project Type**: Infrastructure/Configuration project  
**Performance Goals**: <5min project creation, <2min RLS enablement  
**Constraints**: Security-first with default deny RLS, PKCE auth only, no sensitive data in version control  
**Scale/Scope**: Single project setup, foundational for 10k+ users future scale

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principle Compliance

**✅ Database Schema Governance**
- All future schema changes will use numbered migration files
- Tables will follow pattern: id UUID, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ (soft deletes via deleted_at column)
- Supabase Vault will store all secrets

**✅ Admin-First Design**
- Dashboard configured for platform operators with role-based access control
- Security policies establish foundation for super_admin > content_manager > teacher > viewer hierarchy

**✅ Server-Driven Data Architecture**
- Configuration establishes server-first approach with createServerClient pattern (for future application development)
- No direct client access to sensitive operations

**✅ Performance-First Rendering**
- Realtime limited to specified tables (activity_logs, leaderboard_snapshots) only
- Establishes foundation for LCP < 2.5s requirement

**✅ Export-First Reporting**
- Configuration supports future CSV exports with streaming from Route Handlers
- PDF exports generation framework established

### Additional Constraints Compliance

**✅ Realtime Usage**
- Realtime enabled only for: activity_logs, leaderboard_snapshots (live event feed)
- No other tables will use Realtime per constraints

**✅ Security**
- RLS with default deny policy implemented
- Email/password authentication with PKCE flow only
- No hardcoded secrets - all in environment variables

**✅ Development Practices**
- No console.log - structured logging will be implemented
- TypeScript strict mode enforced
- Error boundaries will wrap dashboard sections

### Gates Status: ✅ PASSED

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
# Infrastructure Configuration Project
scripts/
└── setup/
    ├── supabase-project-setup.sh
    ├── security-config.sh
    └── realtime-setup.sh

docs/
├── supabase-connection.md
├── api-keys.md
└── development-setup.md

.env.local
# Railway environment variables configured in dashboard
```

**Structure Decision**: Infrastructure configuration project with shell scripts for automated setup and documentation for connection details. No source code generated - this is purely infrastructure configuration.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
