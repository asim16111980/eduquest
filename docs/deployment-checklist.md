# Deployment Configuration Checklist

**Date**: 2026-05-10  
**Project**: EduQuest Admin Dashboard  
**Environment**: Railway Production Deployment

## Overview

This checklist ensures all required configurations are properly set up for deploying the EduQuest admin dashboard to Railway. Complete all items before deployment.

## Pre-Deployment Checklist

### 1. Environment Variables Setup ✅/❌

#### Railway Dashboard Variables
- [ ] `SUPABASE_URL` is set to the correct project URL
- [ ] `SUPABASE_ANON_KEY` is copied from Supabase Dashboard → Settings → API
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is copied (server-side only)
- [ ] All three variables are marked as "Production" scope
- [ ] Variables are properly formatted (no typos in keys)

#### Local Development Setup
- [ ] `.env.local` file exists with all required variables
- [ ] `.env.local` is not committed to version control (checked via git status)
- [ ] Template file `.env.local.template` is present and up-to-date

### 2. Supabase Project Configuration ✅/❌

#### Project Setup
- [ ] Supabase project is created and active
- [ ] Project name is `eduquest-admin`
- [ ] Region is set to US (East)
- [ ] Database is fully initialized and accessible

#### Authentication Settings
- [ ] Site URL is set to `https://eduquest-admin.railway.app`
- [ ] Redirect URL is configured as `https://eduquest-admin.railway.app/auth/callback`
- [ ] Email provider is enabled
- [ ] PKCE flow is enabled for security
- [ ] Signups are disabled (admin-only access)

#### Security Configuration
- [ ] Row Level Security (RLS) is enabled globally
- [ ] Default deny policy is applied to all tables
- [ ] Basic policies are created for essential operations
- [ ] No tables allow unrestricted access

#### Realtime Configuration
- [ ] Realtime service is enabled
- [ ] `activity_logs` table is configured for Realtime
- [ ] `leaderboard_snapshots` table is configured for Realtime
- [ ] No other tables have Realtime enabled

### 3. Railway Configuration ✅/❌

#### Project Settings
- [ ] Railway project is created and named `eduquest-admin`
- [ ] Environment is set to "Production"
- [ ] Domain is configured as `eduquest-admin.railway.app`
- [ ] Project is linked to GitHub repository (if using GitHub deployment)

#### Build Configuration
- [ ] Build command is properly set
- [ ] Start command is properly set
- [ ] Port is configured correctly (8080 for Railway)
- [ ] Environment variables are correctly mapped

#### Deployment Settings
- [ ] Automatic deployment is enabled
- [ ] Health checks are configured
- [ ] Deployment logs are monitored for errors
- [ ] Rollback strategy is defined

### 4. Security Validation ✅/❌

#### Secrets Management
- [ ] No API keys are hardcoded in source code
- [ ] Service role key is never used in client-side code
- [ ] Environment variables are properly secured in Railway
- [ ] `.env.local` is in `.gitignore`
- [ ] No sensitive files are staged for git commit

#### Domain Configuration
- [ ] Railway domain is correctly set to `eduquest-admin.railway.app`
- [ ] Site URL in Supabase matches Railway domain
- [ ] SSL certificate is active and valid
- [ ] CORS is properly configured for Railway domain

### 5. Testing and Verification ✅/❌

#### Environment Validation
- [ ] Run `./scripts/verify-env.sh` and check for success
- [ ] Verify all environment variables are properly set
- [ ] Test Railway domain validation passes
- [ ] Check gitignore configuration is complete

#### Connection Testing
- [ ] `supabase link --project-ref YOUR_PROJECT_REF` succeeds
- [ ] `supabase status` shows project details correctly
- [ ] Test authentication with sample credentials
- [ ] Verify Realtime subscriptions work for configured tables

#### Deployment Testing
- [ ] Test deployment in staging environment first
- [ ] Verify all environment variables are available in deployment
- [ ] Test all API endpoints and database connections
- [ ] Verify authentication flow works end-to-end

## Deployment Steps

### Phase 1: Final Verification
1. [ ] Complete all checklist items above
2. [ ] Run full environment validation: `./scripts/verify-env.sh`
3. [ ] Test all setup scripts:
   ```bash
   ./scripts/setup/supabase-project-setup.sh
   ./scripts/setup/security-config.sh  
   ./scripts/setup/realtime-setup.sh
   ```
4. [ ] Verify no sensitive data is committed to git

### Phase 2: Railway Deployment
1. [ ] Push final changes to `001-db-bootstrap` branch
2. [ ] Monitor Railway build logs for errors
3. [ ] Verify deployment succeeds
4. [ ] Check Railway health status

### Phase 3: Post-Deployment Verification
1. [ ] Access `https://eduquest-admin.railway.app`
2. [ ] Verify Supabase connection works
3. [ ] Test authentication with admin credentials
4. [ ] Check Realtime functionality for activity logs
5. [ ] Verify all environment variables are accessible

## Troubleshooting Guide

### Common Deployment Issues

#### Environment Variables Not Available
- **Issue**: Variables not showing in Railway deployment
- **Solution**: 
  - Check variable names are exact (case-sensitive)
  - Ensure "Production" scope is selected
  - Redeploy after making changes

#### Authentication Failing
- **Issue**: Login redirects or errors
- **Solution**:
  - Verify site URL matches Railway domain exactly
  - Check redirect URL in Supabase Auth settings
  - Ensure SSL certificate is active

#### Database Connection Issues
- **Issue**: Cannot connect to Supabase
- **Solution**:
  - Verify project reference is correct
  - Check API keys are properly set
  - Run `supabase link` to verify CLI connection

#### Realtime Not Working
- **Issue**: Realtime subscriptions not receiving updates
- **Solution**:
  - Verify tables are enabled in Realtime settings
  - Check permissions on Realtime channels
  - Test with simple subscription

### Rollback Procedure
If deployment fails:

1. **Immediate Actions**:
   - Check Railway build logs for specific errors
   - Rollback to previous successful deployment
   - Identify and fix the issue

2. **Verification After Fix**:
   - Run environment validation again
   - Test locally before redeploying
   - Monitor deployment closely

## Monitoring and Maintenance

### Post-Deployment Monitoring
- [ ] Monitor Railway deployment health
- [ ] Check Supabase dashboard for connection status
- [ ] Monitor application logs for errors
- [ ] Verify Realtime functionality periodically

### Regular Maintenance Tasks
- [ ] Review environment variables quarterly
- [ ] Rotate API keys if security concerns arise
- [ ] Update Railway configuration as needed
- [ ] Keep documentation updated

## Related Documentation

- [Railway Environment Variables Guide](./railway-env-vars.md)
- [Supabase Connection Guide](./supabase-connection.md)
- [Quick Start Guide](../specs/001-db-bootstrap/quickstart.md)
- [Environment Validation Script](../scripts/verify/verify-env.sh)

## Sign-off

After completing all checklist items and successful deployment:

```
Deployer Name: _________________________
Date: _______________________________
Deployment Environment: Production
Project Version: _______________________

I confirm that all pre-deployment checks have been completed and the deployment
meets all security and functionality requirements.

Signature: ___________________________
```