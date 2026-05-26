# EduQuest Admin Dashboard - Quick Start Guide

Get the EduQuest Admin Dashboard running in minutes with this quick start guide.

## What You'll Need

- GitHub account
- Railway account (free tier available)
- Supabase account (free tier available)
- Node.js 20+ installed locally

## 1. Fork & Clone

### Fork the Repository
1. Go to the EduQuest repository
2. Click "Fork" button

### Clone Locally
```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/eduquest.git
cd eduquest

# Install dependencies
npm install
```

## 2. Configure Railway

### Install Railway CLI
```bash
npm install -g @railway/cli
```

### Login and Initialize
```bash
# Login to Railway
railway login

# Initialize Railway project
railway init
```

### Link to GitHub
1. Go to [Railway Dashboard](https://railway.app/)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose the eduquest repository

## 3. Set Up Environment Variables

In Railway Dashboard:
1. Go to your project
2. Navigate to Variables
3. Add these required variables:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production
```

## 4. Configure Supabase

### Create Supabase Project
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Enter project details
4. Wait for project to be created

### Get Connection Details
From your Supabase project:
1. Go to Settings > API
2. Copy `Project URL`
3. Copy `public` anon key
4. Copy `service_role` key

### Add to Railway
Paste the copied values into Railway environment variables

## 5. Deploy

### First Deployment
```bash
# Deploy to Railway
railway up
```

### Verify Deployment
1. Check Railway dashboard for deployment status
2. Visit your deployed URL
3. Verify health endpoint: `https://your-app.railway.app/api/health`

## 6. Test CI/CD

### Create a Pull Request
1. Create a new branch:
   ```bash
   git checkout -b test-ci
   ```
2. Make a small change (e.g., update a comment)
3. Commit and push:
   ```bash
   git add .
   git commit -m "Test CI pipeline"
   git push origin test-ci
   ```
4. Create pull request to main branch
5. Verify CI pipeline runs successfully

### Merge for Auto-Deployment
1. Merge the PR
2. Railway automatically deploys
3. Monitor deployment progress

## Quick Commands Reference

```bash
# Development
npm run dev          # Start local dev server
npm run build        # Build for production
npm run lint         # Check code style

# Deployment
railway up          # Deploy to Railway
railway logs        # View deployment logs
railway status      # Check deployment status

# Database
supabase status     # Check Supabase connection
```

## Troubleshooting Common Issues

### Build Fails
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npx tsc --noEmit
```

### Deployment Fails
1. Check Railway dashboard logs
2. Verify environment variables
3. Run local build: `npm run build`

### Health Check Fails
```bash
# Test health endpoint
curl https://your-app.railway.app/api/health
```

## Next Steps

After getting the basic setup working:

1. **Set up Database**: Run Supabase setup scripts
2. **Configure Authentication**: Set up user login
3. **Customize UI**: Modify components and styling
4. **Add Features**: Implement your specific requirements

## Need Help?

- **Documentation**: See `docs/` directory
- **Issues**: GitHub Issues tab
- **Community**: Join EduQuest Discord

---

You're now ready to develop on EduQuest! The CI/CD pipeline will automatically handle testing and deployment for you.