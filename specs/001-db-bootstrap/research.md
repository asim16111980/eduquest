# Research: Database Bootstrap Phase 0A

**Date**: 2026-05-10  
**Feature**: Database Bootstrap Phase 0A  
**Branch**: 001-db-bootstrap

## Research Findings

### 1. Supabase Project Creation

**Decision**: Use `supabase new` with manual configuration in dashboard  
**Rationale**: Automated project creation via CLI requires organization-level access which may not be available. Dashboard creation provides more control over settings.  
**Alternatives considered**: 
- `supabase projects create` (requires org access)
- Railway Supabase integration (simpler but less control)

**Commands**:
```bash
# After dashboard creation
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### 2. Row Level Security (RLS) Configuration

**Decision**: Enable RLS globally via SQL with selective policy creation  
**Rationale**: Default deny is constitutionally required but some tables need basic operations for setup.  
**Alternatives considered**:
- Table-by-table enablement (too slow for bootstrap)
- No RLS (violates constitution)

**SQL Commands**:
```sql
-- Enable RLS on all tables
ALTER TABLE TABLE_NAME ENABLE ROW LEVEL SECURITY;

-- Create policies for essential operations
CREATE POLICY "Enable read access for authenticated users"
ON TABLE TABLE_NAME
FOR SELECT USING (auth.uid() IS NOT NULL);

-- For admin operations
CREATE POLICY "Enable full access for super admins"
ON TABLE TABLE_NAME
FOR ALL USING (
  NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND role != 'super_admin'
  )
);
```

### 3. Authentication Configuration

**Decision**: Email/password only with PKCE flow in dashboard  
**Rationale**: Constitution requires email/password with PKCE for security.  
**Alternatives considered**:
- Social logins (violates constitution)
- Magic links (less secure than PKCE)

**Settings**:
- Site URL: `https://eduquest-admin.railway.app`
- Redirect URLs: `https://eduquest-admin.railway.app/auth/callback`
- Disable signups (admin-only access)

### 4. Realtime Configuration

**Decision**: Enable Realtime via dashboard for specific tables only  
**Rationale**: Constitution limits Realtime to activity_logs and leaderboard_snapshots only.  
**Alternatives considered**:
- Enable all tables (violates constitution)
- No Realtime (required for live features)

**Tables to enable**:
- `activity_logs`
- `leaderboard_snapshots`

### 5. Environment Variables Management

**Decision**: Railway environment variables + .env.local for development  
**Rationale**: Railway handles production secrets, .env.local for local development.  
**Alternatives considered**:
- Only .env.local (not secure for production)
- Supabase Secrets (not yet available in free tier)

**Required Variables**:
```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 6. Setup Script Architecture

**Decision**: Three-phase approach with verification steps  
**Rationale**: Separates concerns and allows for error recovery.  
**Alternatives considered**:
- Single monolithic script (harder to debug)
- Manual-only setup (not repeatable)

**Script Structure**:
```bash
# Phase 1: Project Creation
supabase-project-setup.sh

# Phase 2: Security Configuration
security-config.sh

# Phase 3: Realtime Setup
realtime-setup.sh
```

### 7. Error Handling and Recovery

**Decision**: Retry logic with exponential backoff for transient failures  
**Rationale**: Supabase API can be unreliable during peak times.  
**Alternatives considered**:
- No retries (fails on temporary issues)
- Infinite retries (can mask real problems)

**Retry Strategy**:
- Max 3 attempts
- Exponential backoff: 2s, 4s, 8s
- Clear error messages for manual intervention

## Best Practices Applied

1. **Security First**: All secrets in environment variables
2. **Constitution Compliance**: All constraints respected
3. **Documentation**: Every step documented for future reference
4. **Automation**: Repeatable setup process
5. **Error Handling**: Graceful failure with recovery paths

## Open Questions

None - all technical unknowns resolved through research.