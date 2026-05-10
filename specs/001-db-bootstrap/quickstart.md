# Quick Start: Database Bootstrap Phase 0A

**Date**: 2026-05-10  
**Target**: EduQuest Admin Dashboard Database Setup  
**Platform**: Railway + Supabase

## Prerequisites

1. **Railway Account**: Active Railway account with project created
2. **Supabase CLI**: Installed and authenticated (`supabase login`)
3. **Git Repository**: Clean working directory
4. **Environment**: Node.js 20+ for local development

## Setup Steps

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Enter project details:
   - **Name**: eduquest-admin
   - **Database Password**: Generate strong password
   - **Region**: US (East)
   - **Organization**: Your organization
4. Wait for project creation (5-10 minutes)

### 2. Configure Authentication

1. In Supabase Dashboard → Settings → Authentication
2. Configure Site URL:
   - **Site URL**: `https://eduquest-admin.railway.app`
3. Under "Redirect URLs", add:
   - `https://eduquest-admin.railway.app/auth/callback`
4. Enable "Email provider"
5. Enable PKCE under "Configuration"

### 3. Enable Row Level Security

1. In Supabase Dashboard → Settings → Database
2. Run the following SQL in the SQL Editor to enable RLS on required tables:

```sql
-- Enable RLS on core tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT 
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname IN ('users', 'activities', 'leaderboard_snapshots', 'activity_logs');
```

> Note: RLS will be configured with specific policies during schema migrations via the security-config.sh script.

### 4. Configure Realtime

1. In Supabase Dashboard → Settings → Realtime
2. Enable Realtime service
3. Add tables to Realtime:
   - `activity_logs`
   - `leaderboard_snapshots`

### 5. Set Up Environment Variables

#### Railway Dashboard Variables

Add these to your Railway project settings:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
# ⚠️ SERVER-ONLY KEY: DO NOT EXPOSE TO CLIENTS / NO LOGGING
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

#### Local Development

Create `.env.local` in project root:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
# ⚠️ SERVER-ONLY KEY: DO NOT EXPOSE TO CLIENTS / NO LOGGING
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 6. Link Supabase CLI

```bash
# Link your local project to the remote
supabase link --project-ref YOUR_PROJECT_REF

# Verify connection
supabase status
```

### 7. Run Setup Scripts

```bash
# Execute setup scripts in order
./scripts/setup/supabase-project-setup.sh
./scripts/setup/security-config.sh
./scripts/setup/realtime-setup.sh
```

## Verification

### Check Project Connection

```bash
# Should show project details
supabase projects list
```

### Test Authentication

```bash
# Test with Supabase Auth
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
supabase.auth.signUp({ email: 'test@example.com', password: 'test123' })
  .then(({ data, error }) => {
    if (error) {
      console.error('Auth error:', error);
      process.exit(1);
    } else {
      console.log('User created:', data.user);
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
"
```

### Verify Realtime

1. Go to Supabase Dashboard → Realtime
2. Check that both tables are enabled
3. Verify channels are configured

### Environment Variables Check

```bash
# Check if variables are set (DO NOT print values)
[ -n "$SUPABASE_URL" ] && echo "SUPABASE_URL is set" || echo "SUPABASE_URL is not set"
[ -n "$SUPABASE_ANON_KEY" ] && echo "SUPABASE_ANON_KEY is set" || echo "SUPABASE_ANON_KEY is not set"
[ -n "$SUPABASE_SERVICE_ROLE_KEY" ] && echo "SUPABASE_SERVICE_ROLE_KEY is set" || echo "SUPABASE_SERVICE_ROLE_KEY is not set"
```

## Troubleshooting

### Common Issues

1. **CLI Link Fails**
   - Verify project reference is correct
   - Check CLI is authenticated
   - Ensure project is fully created

2. **RLS Not Working**
   - Verify RLS is enabled on table
   - Check policies exist
   - Test with service role key

3. **Realtime Not Connecting**
   - Verify table is in Realtime settings
   - Check CORS configuration
   - Ensure frontend is using correct URL

### Support

- [Supabase Documentation](https://supabase.com/docs)
- [Railway Documentation](https://docs.railway.app)
- Project: `001-db-bootstrap`

## Next Steps

1. Review `docs/supabase-connection.md` for detailed setup
2. Configure schema migrations in Phase 1
3. Set up CI/CD pipeline for automated deployments