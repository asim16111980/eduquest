# Supabase Project Setup Reference

**Project**: EduQuest Admin Dashboard  
**Created**: 2026-05-12  
**Last Updated**: {date}  
**Version**: 1.0

## Project Overview

This document provides reference information for the EduQuest Supabase project, including connection details, API keys, and configuration settings.

## Project Details

### Basic Information

| Field | Value |
|-------|-------|
| **Project Name** | eduquest-admin |
| **Project Reference** | `{PROJECT_REF}` |
| **Region** | US East (us-east-1) |
| **Status** | Active |
| **Organization** | EduQuest |

### Connection Strings

#### Production (Railway)
```env
# Required for all applications
SUPABASE_URL=https://{PROJECT_REF}.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ⚠️ SERVER-ONLY KEY: DO NOT EXPOSE TO CLIENTS
# Use only for server-side operations
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Local Development
```env
# Create .env.local in your project root
SUPABASE_URL=https://{PROJECT_REF}.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ⚠️ SERVER-ONLY KEY: DO NOT EXPOSE TO CLIENTS
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## API Keys

### Anonymous Key (Public)
- **Purpose**: Client-side applications
- **Permissions**: Read-only access to public tables
- **Usage**: Frontend applications, mobile apps
- **Security**: Safe to expose in client code

### Service Role Key (Server Only)
- **Purpose**: Server-side operations, migrations
- **Permissions**: Full access to all tables and operations
- **Usage**: Backend services, database migrations
- **Security**: 🔒 **NEVER expose in client code**

## Authentication Configuration

### Email/Password Provider
- **Enabled**: ✅ Yes
- **Site URL**: `https://eduquest-admin.railway.app`
- **Redirect URLs**: 
  - `https://eduquest-admin.railway.app/auth/callback`
- **PKCE Flow**: ✅ Enabled

### Auth Links
- **Dashboard**: [Supabase Auth](https://app.supabase.com/project/{PROJECT_REF}/auth)
- **Configuration**: Settings → Authentication

## Database Configuration

### Connection Methods

#### CLI Connection
```bash
# Link your local project
supabase link --project-ref {PROJECT_REF}

# Check status
supabase status

# Open database shell
supabase db shell
```

#### Programmatic Connection
```javascript
// Client-side (using anon key)
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://{PROJECT_REF}.supabase.co',
  'YOUR_ANON_KEY'
)

// Server-side (using service role key)
const supabaseAdmin = createClient(
  'https://{PROJECT_REF}.supabase.co',
  'YOUR_SERVICE_ROLE_KEY',
  { 
    auth: { autoRefreshToken: false, persistSession: false }
  }
)
```

## Environment Variables

### Railway Dashboard
Add these variables to your Railway project settings:

1. Go to Railway Dashboard → Settings → Variables
2. Add each variable with its value

| Variable | Value | Required | Description |
|----------|-------|----------|-------------|
| `SUPABASE_URL` | `https://{PROJECT_REF}.supabase.co` | ✅ | Project URL |
| `SUPABASE_ANON_KEY` | `your_anon_key` | ✅ | Public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | `your_service_role_key` | ✅ | Server-only key |

## Security Settings

### Row Level Security (RLS)
- **Status**: Enabled with default deny
- **Tables with RLS**: All tables
- **Policy**: Explicit access required

### CORS Configuration
```javascript
// Example CORS configuration
const cors = {
  origin: ['https://eduquest-admin.railway.app'],
  credentials: true
}
```

## Realtime Configuration

### Enabled Tables
- `activity_logs`
- `leaderboard_snapshots`

### Realtime Dashboard
- **URL**: [Supabase Realtime](https://app.supabase.com/project/{PROJECT_REF}/realtime)

## Scripts and Utilities

### Setup Scripts
1. **Project Setup**: `scripts/setup/supabase-project-setup.sh`
   - Creates new project
   - Configures basic settings
   
2. **Verification**: `scripts/verify/project-connection.sh`
   - Tests project connection
   - Validates configuration

### Common Commands

```bash
# List all projects
supabase projects list

# Get project details
supabase projects list --project-ref {PROJECT_REF}

# Link local project
supabase link --project-ref {PROJECT_REF}

# Start local development
supabase start

# Stop local development
supabase stop

# Reset local database
supabase db reset
```

## Troubleshooting

### Common Issues

1. **CLI Link Fails**
   ```bash
   # Solution: Verify project reference and status
   supabase projects list --project-ref {PROJECT_REF}
   ```

2. **Authentication Errors**
   ```bash
   # Solution: Check auth configuration
   supabase auth status
   ```

3. **Database Connection Issues**
   ```bash
   # Solution: Test database connection
   supabase db shell --command "SELECT 1;"
   ```

### Log Locations
- **CLI Logs**: `~/.supabase/logs/`
- **Application Logs**: Railway Dashboard → Logs

## Backup and Recovery

### Manual Backup
```bash
# Create database dump
supabase db dump --dbname public > backup.sql

# Download storage files
supabase storage list
supabase storage download bucket_name/path/to/file
```

### Scheduled Backups
- Configure in Railway Dashboard → Settings → Backup
- Daily backups at 2:00 AM UTC

## Support

### Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [EduQuest Wiki](internal-link)

### Contact
- **Project Team**: EduQuest Admin Dashboard
- **Technical Lead**: [Name]
- **Slack Channel**: #eduquest-admin

---

*This document is automatically generated and should be updated when project configuration changes.*