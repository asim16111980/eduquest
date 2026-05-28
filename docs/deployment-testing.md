# Deployment Testing Guide

This guide explains how to test Railway deployments for the EduQuest Admin Dashboard.

## Prerequisites

- Railway CLI installed (`npm install -g @railway/cli`)
- Railway project linked (`railway login` and `railway link`)
- Railway environment variables set up

## Testing Manual Deployment

### 1. Manual Merge to Main

```bash
# Switch to main branch
git checkout main

# Merge the feature branch
git merge 002-dev-bootstrap

# Push to trigger Railway deployment
git push origin main
```

### 2. Monitor Deployment

Check the Railway dashboard or use the CLI:

```bash
# Monitor deployment progress
railway logs --follow

# Check deployment status
railway status
```

### 3. Test the Deployment

Once the deployment is complete, test the following:

#### Health Check
```bash
curl https://your-app.railway.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-28T...",
  "uptime": 123,
  "memory": {
    "rss": 12345678,
    "heapUsed": 1234567,
    "heapTotal": 2345678
  },
  "database": "up"
}
```

#### Main Pages
- Visit `https://your-app.railway.app/` - Should show home page
- Visit `https://your-app.railway.app/login` - Should show login page
- Visit `https://your-app.railway.app/dashboard` - Should redirect to login

#### Monitoring Dashboard
- Visit `https://your-app.railway.app/dashboard/monitoring` - Should show monitoring page

## Automated Testing

### Using the Test Script

The `scripts/test-deployment.js` script can automatically test deployments:

```bash
# Test with Railway URL
node scripts/test-deployment.js https://your-app.railway.app

# Or use environment variable
export RAILWAY_URL=https://your-app.railway.app
node scripts/test-deployment.js
```

The script will:
- Check the health endpoint every 30 seconds
- Retry up to 10 times
- Verify the response matches expected format
- Check response time is under 5 seconds
- Report performance metrics

### CI/CD Integration

Add the test to your CI pipeline:

```yaml
# .github/workflows/deploy-test.yml
name: Deploy Test

on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]

jobs:
  test-deployment:
    runs-on: ubuntu-latest
    if: github.event.workflow_run.conclusion == 'success'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Test Railway deployment
      env:
        RAILWAY_URL: ${{ secrets.RAILWAY_URL }}
      run: node scripts/test-deployment.js
```

## Performance Expectations

- **Response Time**: < 2 seconds for health check
- **Database Connection**: < 500ms
- **Uptime**: Should show increasing time after deployment
- **Memory**: Should be reasonable (typically < 500MB for small app)

## Common Issues

### 1. Health Check Fails
- Check Railway logs for errors
- Verify environment variables are set
- Check database connection string

### 2. Slow Response
- Check Railway instance size
- Monitor CPU and memory usage
- Check for database query issues

### 3. Deployment Times Out
- Verify build settings in Railway
- Check for large dependencies
- Optimize bundle size

## Rollback Strategy

If deployment fails:

1. **Check Railway Dashboard**
   - View deployment logs
   - Check error messages

2. **Manual Rollback**
   ```bash
   railway rollback --service <service-name>
   ```

3. **Auto-deployment Disabled**
   - Disable auto-deployment in Railway settings
   - Test manually before deploying

## Monitoring

### Railway Dashboard
- View real-time logs
- Monitor resource usage
- Check deployment history

### Application Monitoring
- Visit `/dashboard/monitoring` for real-time metrics
- Monitor response times and error rates
- Track memory usage patterns

### Alerts (Optional)
Set up alerts in Railway for:
- High CPU usage (> 80%)
- High memory usage (> 90%)
- Deployment failures
- Health check failures