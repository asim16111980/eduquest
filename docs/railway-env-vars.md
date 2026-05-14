# Railway Environment Variables

**Date**: 2026-05-10  
**Project**: EduQuest Admin Dashboard  
**Environment**: Railway Deployment

## Overview

This document documents all required environment variables that must be configured in the Railway dashboard for the EduQuest admin dashboard. These variables are required for proper Supabase integration and secure deployment.

## Required Variables

### Supabase Connection Variables

| Variable | Description | Example Value | Security Level |
|----------|-------------|---------------|----------------|
| `SUPABASE_URL` | The Supabase project URL | `https://your-project-ref.supabase.co` | Public |
| `SUPABASE_ANON_KEY` | The anonymous public key for client access | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | The service role key for server-side operations | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | **Private (Server Only)** |

## Security Guidelines

### 🔴 Private Keys (Server Only)
**NEVER expose these in client-side code:**

- `SUPABASE_SERVICE_ROLE_KEY` - Only use in server-side operations, backend APIs, or CLI commands
- Never log these values
- Never commit to version control
- Rotate immediately if compromised

### 🟡 Public Keys (Client Safe)
**Safe to use in client-side code:**

- `SUPABASE_URL` - Required for client connections
- `SUPABASE_ANON_KEY` - Required for client authentication and data access

## Railway Dashboard Configuration

### Step-by-Step Setup

1. **Open Railway Dashboard**
   - Go to your Railway project: `eduquest-admin.railway.app`
   - Navigate to the "Variables" tab

2. **Add Required Variables**
   - Click "Add Variable" for each required environment variable
   - Use the exact names listed above
   - Set values from your Supabase dashboard

3. **Variable Order**
   ```
   1. SUPABASE_URL
   2. SUPABASE_ANON_KEY
   3. SUPABASE_SERVICE_ROLE_KEY
   ```

4. **Environment Scope**
   - Set all variables to "Production" scope
   - Do NOT set "Deploy" variables unless specifically required

### Supabase Dashboard Location

1. **Get Project URL and Keys**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Select your project (`eduquest-admin`)
   - Navigate to "Settings" → "API"
   - Copy the values from the "Project API keys" section

2. **Project Reference**
   - The `SUPABASE_URL` format is: `https://YOUR_PROJECT_REF.supabase.co`
   - `YOUR_PROJECT_REF` is found in the URL: `https://app.supabase.com/project/YOUR_PROJECT_REF`

## Local Development

### .env.local File

Create `.env.local` in your project root for local development:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
# ⚠️ SERVER-ONLY KEY: DO NOT EXPOSE TO CLIENTS
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Environment Validation

Run the validation script to ensure proper configuration:

```bash
./scripts/verify-env.sh
```

## Verification

### 1. Railway Variables Check

```bash
# Check if Railway variables are set (in Railway deployment)
echo "SUPABASE_URL: ${SUPABASE_URL:0:20}..."
echo "SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:0:20}..."
echo "SUPABASE_SERVICE_ROLE_KEY: [REDACTED]"
```

### 2. Connection Test

```bash
# Test Supabase connection
npm run test:supabase:connect
```

### 3. Security Verification

```bash
# Verify no secrets are committed
git status
# Should show .env.local as untracked
```

## Troubleshooting

### Common Issues

1. **Missing Variables**
   - Railway deployment fails with "undefined variable"
   - Solution: Add missing variables to Railway dashboard

2. **Wrong Variable Names**
   - Case-sensitive errors
   - Solution: Use exact names: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

3. **Key Exposure**
   - Service role key found in client code
   - Solution: Audit all client-side code, ensure only anon key is used

### Key Rotation

If keys are compromised:

1. **Generate New Keys**
   - In Supabase Dashboard → Settings → API
   - Click "Reset" for each key

2. **Update Railway Variables**
   - Update all three variables in Railway dashboard

3. **Update Local .env.local**
   - Update your local development file

4. **Restart Deployment**
   - Redeploy Railway service to pick up new variables

## Monitoring

### Environment Health Check

Monitor these indicators for proper environment configuration:

- ✅ Railway deployment shows all variables as "Set"
- ✅ Supabase connection tests pass
- ✅ No security warnings in deployment logs
- ✅ Client applications can authenticate successfully

### Audit Trail

Keep track of:
- When variables were last updated
- Who made changes
- Reason for key rotation
- Deployment results after changes

## Related Documentation

- [Supabase Connection Guide](./supabase-connection.md)
- [Deployment Checklist](./deployment-checklist.md)
- [Authentication Setup](./authentication-setup.md)
- [Quick Start Guide](../specs/001-db-bootstrap/quickstart.md)