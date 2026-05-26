# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EduQuest is an admin dashboard for an educational gamification platform. It is currently in **Phase 0A (Database Bootstrap)** — setting up Supabase infrastructure before any application code exists.

**Stack (planned):** Next.js 15 (App Router) + TypeScript strict + Tailwind v4 + Supabase (PostgreSQL, Auth, Realtime) + Railway deployment.

**Current state:** Infrastructure-only — shell scripts for Supabase setup, no Next.js app yet. The `package.json` has only `supabase` CLI as a devDependency.

## Architecture

The project follows a phased build across three work areas:

1. **Area 1 — Database** (Phase 0A, Phase 1): Supabase schema, RLS, functions, seed data. All changes through numbered migration files.
2. **Area 2 — Backend** (Phase 0B+): Next.js Route Handlers, server-side queries, auth middleware, export pipeline.
3. **Area 3 — Frontend** (Phase 0B+): All UI — pages, components, charts. Built separately, wired to live data in Phase 6.

**Dependency order:** Area 1 must complete before Area 2. Area 2 must have stable query interfaces before Area 3 connects.

### Key Design Decisions

- **Server-first data:** `createServerClient` by default; Client Components only for Realtime subscriptions and user-triggered mutations
- **Role hierarchy:** `super_admin > content_manager > teacher > viewer > student` — enforced via RLS and middleware
- **Realtime restricted to:** `activity_logs` and `leaderboard_snapshots` tables only; all other data uses polling
- **Soft deletes:** All standard entity tables use `deleted_at TIMESTAMPTZ` (not hard deletes)
- **Schema pattern:** Every table gets `id UUID DEFAULT gen_random_uuid() PK`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`, `deleted_at TIMESTAMPTZ`. Append-only tables (logs, stats) may omit `updated_at`/`deleted_at`.

## Repository Structure

```
scripts/
  setup/              # Setup scripts (run in strict order)
    supabase-project-setup.sh
    security-config.sh
    realtime-setup.sh
  verify/             # Verification scripts
    project-connection.sh
    security-verification.sh
    verify-realtime.sh
  lib/                # Shared shell utilities
    logging.sh
    retry-utils.sh
    env-validation.sh
sql/                  # Raw SQL files
  enable-rls.sql
supabase/             # Supabase project (CLI-linked)
specs/001-db-bootstrap/   # Feature spec, plan, research, data model, tasks
docs/                 # Project documentation
.specify/             # Speckit templates and constitution
```

## Setup & Commands

### Prerequisites
- Supabase CLI installed and authenticated (`supabase login`)
- Node.js 20+
- `.env.local` with `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### Setup Scripts (must run in this exact order)
```bash
./scripts/setup/supabase-project-setup.sh
./scripts/setup/security-config.sh
./scripts/setup/realtime-setup.sh
```

### Verification
```bash
./scripts/verify/project-connection.sh
./scripts/verify/security-verification.sh
./scripts/verify/verify-realtime.sh
```

### Supabase CLI
```bash
supabase link --project-ref $SUPABASE_PROJECT_REF
supabase status
supabase db push          # Apply migrations
supabase db reset         # Reset and re-apply all migrations + seed
supabase gen types typescript --local  # Regenerate TypeScript types from schema
```

## Constitution Rules (source of truth: `.specify/memory/constitution.md`)

These rules override all other practices:

- **No `any` or `ts-ignore`** without an explaining comment
- **No inline styles** — Tailwind utility classes only
- **No `console.log` in committed code** — use structured logger
- **All mutations** use optimistic UI + server validation
- **Error boundaries** wrap every dashboard section
- **CSV exports** streamed from Route Handlers, never buffered; PDF exports max 500 rows
- **LCP target** < 2.5s on dashboard overview page
- **TypeScript strict mode** enforced

## Environment Variables

Required in `.env.local` (never committed — in `.gitignore`):

| Variable | Description |
|---|---|
| `SUPABASE_URL` | `https://<ref>.supabase.co` |
| `SUPABASE_ANON_KEY` | Public anon key (JWT) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin key — never expose to clients |
| `SUPABASE_PROJECT_REF` | Project reference ID |
| `SUPABASE_DB_URL` | Direct PostgreSQL connection string |

Production secrets are stored in Railway environment variables, not in code.

## Branch Strategy

- Feature work on branch `001-db-bootstrap`
- PR target: `main`
- CI pipeline (planned): lint -> typecheck -> build via GitHub Actions

## Speckit Workflow

This repo uses Speckit for structured development. Feature specs live in `specs/<feature>/`. The workflow is:
1. `/speckit-specify` — create feature spec
2. `/speckit-plan` — generate implementation plan, research, data model
3. `/speckit-tasks` — generate dependency-ordered tasks
4. `/speckit-implement` — execute tasks

## Key References

- `specs/001-db-bootstrap/plan.md` — current implementation plan
- `specs/001-db-bootstrap/data-model.md` — database entity design
- `specs/001-db-bootstrap/tasks.md` — task tracking with dependencies
- `specs/001-db-bootstrap/quickstart.md` — setup guide
- `specs/002-dev-bootstrap/plan.md` — **Development Bootstrap plan** (current: User Stories 1-5)
- `specs/002-dev-bootstrap/data-model.md` — domain types and entities
- `specs/002-dev-bootstrap/research.md` — technical decisions for bootstrap phase
- `specs/002-dev-bootstrap/tasks.md` — **Development Bootstrap tasks** (current)
- `specs/002-dev-bootstrap/quickstart.md` — **setup guide for bootstrap phase**
- `docs/implementation-plan.md` — master plan across all 7 phases (66 work items)
- `.specify/memory/constitution.md` — project constitution (v1.0.0)
