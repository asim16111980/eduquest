# EduQuest Constitution
<!-- Project-wide principles, stack rules, and architectural contracts -->
<!-- This file is the source of truth. All specs, plans, and tasks derive from it -->
<!-- When in conflict, this file wins -->

## Core Principles

### I. Admin-First Design
<!-- Dashboard built for platform operators with role-based access -->
Dashboard built for platform operators with role-based access control. Every UI element respects the user's role hierarchy (super_admin > content_manager > teacher > viewer).

### II. Server-Driven Data Architecture
<!-- Server Components fetch by default, Client Components for realtime -->
Server Components fetch by default using createServerClient. Client Components only fetch for realtime subscriptions or user-triggered mutations. No direct Supabase calls from the client for sensitive operations.

### III. Database Schema Governance
<!-- All changes through migrations, consistent schema patterns -->
All schema changes go through numbered migration files. Every table has id UUID, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ. Soft deletes only via deleted_at column. Secrets stored in Supabase Vault.

### IV. Performance-First Rendering
<!-- LCP targets, virtualization, pre-computed queries -->
Dashboard overview page LCP < 2.5s. All charts render with skeleton loaders. Heavy tables use virtualization for >100 rows. Analytics queries aggregating >10k rows pre-computed via Postgres views.

### V. Export-First Reporting
<!-- Exports respect filters, streamed server-side -->
All exports respect current filter state. CSV exports streamed from Route Handlers, never buffered. PDF exports generated server-side. Exports include appropriate headers and format detection.

## Additional Constraints
<!-- Realtime usage, code quality, styling rules -->
- Realtime used only for: leaderboard widgets, active-user counter, live event feed
- All other data uses SWR/React Query with 30-second polling intervals
- TypeScript strict mode: no `any`, no `ts-ignore` without comment explaining why
- No inline styles — Tailwind utility classes only
- Components are single-responsibility: chart components render charts, table components render tables
- All mutations go through optimistic UI + server validation

## Development Workflow
<!-- Code review, CI pipeline, accessibility, logging -->
- Code review required for all PRs
- Lint → typecheck → build CI pipeline via GitHub Actions
- Error boundaries wrap every dashboard section
- Accessible by default: ARIA labels, keyboard navigation, WCAG AA minimum colour contrast
- No console.log in committed code — use structured logger utility

## Governance
<!-- Constitution authority, amendment process, versioning -->
Constitution supersedes all other practices. Amendments require documentation and approval. Version bump according to semantic versioning:
- MAJOR: Backward incompatible governance/principle removals or redefinitions
- MINOR: New principle/section added or materially expanded guidance
- PATCH: Clarifications, wording, typo fixes, non-semantic refinements

**Version**: 1.0.0 | **Ratified**: 2026-05-09 | **Last Amended**: 2026-05-09