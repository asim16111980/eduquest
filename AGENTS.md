# AGENTS.md

## Essential Commands & Setup

### Required Environment Variables
Create `.env.local` in project root:
```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
# ⚠️ SERVER-ONLY KEY: DO NOT EXPOSE TO CLIENTS / NO LOGGING
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_PROJECT_REF=your_project_ref_here
SUPABASE_DB_URL=postgresql://postgres:password@db.your_project_ref.supabase.co:5432/postgres
SUPABASE_API_URL=https://api.your_project_ref.supabase.co
```

### Critical Setup Order
**Scripts MUST be executed in this exact order:**
```bash
# Phase 1: Project Setup
./scripts/setup/supabase-project-setup.sh

# Phase 2: Security Configuration  
./scripts/setup/security-config.sh

# Phase 3: Realtime Features
./scripts/setup/realtime-setup.sh

# Verification (after all setup)
./scripts/verify/verify-realtime.sh
./scripts/verify/security-verification.sh
./scripts/verify/project-connection.sh
```

## Project Structure

### Scripts Organization
- `scripts/setup/` - Setup scripts (execute in order)
- `scripts/verify/` - Verification scripts 
- `scripts/lib/` - Shared utilities (retry, logging, env validation)
- `sql/` - Database schema files

### Key Files
- `specs/001-db-bootstrap/tasks.md` - Task tracking and dependencies
- `specs/001-db-bootstrap/quickstart.md` - Setup guide
- `specs/001-db-bootstrap/plan.md` - Implementation plan

## Development Workflow

### Branch Strategy
- Work on branch `001-db-bootstrap`
- All changes must be committed before creating PR
- PR target: `main` branch

### Testing Approach
- Manual verification via CLI scripts
- No automated tests (shell script context)
- Realtime testing uses LISTEN/NOTIFY with pg_notify

## Important Constraints

### Security First
- **RLS**: Default deny policy on all tables
- **Auth**: Email/password only with PKCE flow
- **No secrets in version control** - use Railway env vars
- Realtime channels require authenticated users

### Railway Integration
- Deploy target: `eduquest-admin.railway.app`
- Environment variables configured via Railway dashboard
- Supabase project linked to Railway deployment

## Speckit Integration

This repo uses Speckit for structured development:
- Feature specifications in `specs/001-db-bootstrap/`
- Task generation and tracking
- Implementation planning workflow
- See `CLAUDE.md` for context links

## Common Pitfalls

1. **Script Order**: Setup scripts must run in exact sequence (Project → Security → Realtime)
2. **Environment**: All SUPABASE_* variables must be set before running scripts
3. **Idempotency**: Scripts are designed to be rerun safely (DROP IF EXISTS patterns)
4. **Realtime Testing**: Uses pg_notify, not WebSocket directly (shell script limitation)
5. **Cleanup**: Test data includes `__test: true` marker for cleanup