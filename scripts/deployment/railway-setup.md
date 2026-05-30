# Railway Setup Guide

## Environment Variables for Railway Dashboard

Required environment variables that must be set in the Railway dashboard:

### Core Configuration
- `NODE_ENV`: production
- `PORT`: 3000

### Supabase Configuration
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

### Performance Monitoring
- `SENTRY_DSN`: Your Sentry DSN (optional)

### Logging
- `LOG_LEVEL`: info

### Performance Optimization
- `BUNDLE_ANALYZE`: false

### Database Connection Pool (if needed)
- `DB_POOL_MIN`: 2
- `DB_POOL_MAX`: 10

## Setup Steps

1. Deploy to Railway
2. Go to Railway dashboard → Settings → Variables
3. Add all required environment variables
4. Redeploy after adding variables

## Health Check Configuration

The application includes a health check endpoint at `/api/health` that Railway will monitor automatically.

## Monitoring

After deployment:
- Check Railway dashboard for deployment status
- Monitor logs for any errors
- Verify health check passes
- Performance metrics are available in Railway dashboard