# Railway Deployment Setup

## Required Environment Variables

When deploying to Railway, set these environment variables in the Railway dashboard:

### Supabase Configuration
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)

### Monitoring & Analytics
- `SENTRY_DSN` - Sentry DSN for error tracking (optional)
- `LOG_LEVEL` - Set to "info" (default) or "debug" for detailed logging

### Performance Monitoring
- `NODE_ENV` - Must be "production"
- `PORT` - Set to "3000" (Railway default)

## Setup Steps

1. Deploy to Railway:
   ```bash
   railway login
   railway init
   railway up
   ```

2. Configure environment variables in Railway dashboard:
   - Go to your Railway project
   - Navigate to Variables section
   - Add all required variables from above

3. Set up health checks:
   - Railway automatically provides health checks at `/api/health`
   - Configure in Railway dashboard under Health Checks
   - Set timeout to 30 seconds
   - Set retries to 3

## Deployment Strategy

- **Auto-deploy**: Every push to main branch triggers deployment
- **Rollbacks**: Railway maintains deployment history for easy rollback
- **Monitoring**: Deployments are monitored for health and performance
- **CI Integration**: Full CI pipeline runs before deployment

## Performance Targets

- Deployment time: < 5 minutes
- LCP target: < 2.5s
- Error rate: < 0.1%
- Uptime: 99.9%
- Bundle size optimization with @next/bundle-analyzer

## Security Considerations

- All environment variables are encrypted at rest
- Railway provides automatic HTTPS
- Built-in DDoS protection
- Secure headers configuration

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (must be 20+)
   - Verify all dependencies in package.json
   - Run `npm audit` to check for vulnerabilities

2. **Runtime Errors**
   - Verify all environment variables are set
   - Check Supabase connectivity
   - Review Railway logs for detailed error messages

3. **Performance Issues**
   - Use `npm run analyze` to check bundle size
   - Monitor LCP in Railway metrics
   - Enable compression in Railway settings