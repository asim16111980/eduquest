# Auto-Deployment Configuration

## How Auto-Deployment Works

Railway automatically deploys when:
1. Code is pushed to the `main` branch
2. A pull request is merged to `main`
3. Manual deployment is triggered from Railway dashboard

## Deployment Process

1. **Trigger**: Push/merge to main branch
2. **Build**: Railway builds the Next.js application
3. **Deploy**: Application is deployed to production
4. **Health Check**: Railway monitors the deployment
5. **Rollback**: If health checks fail, deployment is rolled back

## Verification Steps

After deployment, verify:
- [ ] Application is accessible at the Railway URL
- [ ] Health check endpoint `/api/health` returns 200
- [ ] All pages load without errors
- [ ] Authentication works correctly
- [ ] Database queries execute successfully

## Monitoring

Check these metrics in Railway dashboard:
- Response time
- Error rate
- CPU/Memory usage
- Health check status

## Rollback Trigger

Automatic rollback occurs when:
- Health checks fail 3 times in a row
- Application crashes repeatedly
- Memory usage exceeds 90% for 5 minutes
- CPU usage exceeds 90% for 5 minutes