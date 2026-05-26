# EduQuest Admin Dashboard - Complete Setup Guide

This guide provides step-by-step instructions for setting up the EduQuest Admin Dashboard with full CI/CD pipeline.

## Prerequisites

### System Requirements
- Node.js 20 or higher
- npm or yarn
- Git
- Supabase CLI (for database setup)

### Accounts Needed
- GitHub account
- Railway account
- Supabase account

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/your-username/eduquest.git
cd eduquest
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Create `.env.local` file:
```bash
cp .env.local.example .env.local
# Edit with your Supabase credentials
```

### 4. Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## Detailed Setup

### Phase 1: Project Initialization

#### 1.1 Verify Dependencies
```bash
node --version  # Should be 20.x+
npm --version   # Should be 9.x+
```

#### 1.2 Install Global Dependencies
```bash
npm install -g @railway/cli
npm install -g supabase-cli
```

#### 1.3 Setup Git Repository
```bash
git init
git add .
git commit -m "Initial commit"
```

### Phase 2: Database Setup (Area 1)

#### 2.1 Initialize Supabase Project
```bash
supabase new
# Follow prompts to create new project
```

#### 2.2 Link Local Project
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

#### 2.3 Run Setup Scripts
```bash
# Setup scripts must be run in order
./scripts/setup/supabase-project-setup.sh
./scripts/setup/security-config.sh
./scripts/setup/realtime-setup.sh
```

#### 2.4 Verify Database Connection
```bash
./scripts/verify/project-connection.sh
```

### Phase 3: Application Setup (Area 2)

#### 3.1 Configure Railway
```bash
railway login
railway init
```

#### 3.2 Set Environment Variables in Railway Dashboard
Required variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NODE_ENV=production`

#### 3.3 Verify Configuration
```bash
node scripts/verification/ci-verification.js
```

### Phase 4: CI/CD Pipeline Setup

#### 4.1 Configure GitHub Repository
1. Create GitHub repository
2. Push code to GitHub:
   ```bash
   git remote add origin https://github.com/your-username/eduquest.git
   git push -u origin main
   ```

#### 4.2 Verify CI Pipeline
The CI pipeline includes:
- **Lint**: ESLint code quality checks
- **Type Check**: TypeScript type validation
- **Build**: Next.js build process
- **Test**: Playwright E2E tests
- **Security**: CodeQL security analysis

#### 4.3 Test Deployment
```bash
node scripts/deployment/test-deployment.js
```

## Development Workflow

### Daily Development
```bash
# Start development server
npm run dev

# Run linting
npm run lint

# Type check
npx tsc --noEmit

# Build for production
npm run build
```

### Testing
```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all
```

### Deployment Process

#### Manual Deployment
```bash
# Build locally
npm run build

# Deploy to Railway
railway up
```

#### Auto-Deployment (Recommended)
1. Make changes
2. Commit: `git commit -m "Description"`
3. Push: `git push origin main`
4. Railway automatically deploys

## Monitoring and Maintenance

### Health Checks
- Application health: `https://your-app.railway.app/api/health`
- Railway dashboard: Monitor deployments and logs
- Error tracking: Configure Sentry if needed

### Performance Monitoring
```bash
# Analyze bundle size
npm run analyze

# Monitor deployment performance
node scripts/monitoring/deployment-performance.js
```

### Rollback Procedures
```bash
# View deployment history
railway deployments

# Rollback to previous version
railway rollback

# Or via Railway dashboard
```

## Configuration Files

### Railway Configuration (`railway.toml`)
```toml
[build]
command = "npm run build"

[deploy]
startCommand = "npm start"

[healthcheck]
path = "/api/health"
interval = 30
timeout = 10
retries = 3
```

### CI Pipeline (`.github/workflows/ci.yml`)
Runs on:
- Push to main/002-dev-bootstrap branches
- Pull requests to main

Jobs:
- lint, typecheck, build, test, security

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Public anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npx tsc --noEmit
```

#### Railway Deployment Issues
```bash
# Check Railway status
railway status

# View logs
railway logs

# Reset deployment
railway down
railway up
```

#### Database Connection Issues
```bash
# Verify Supabase connection
supabase status

# Check RLS policies
supabase db reset
```

### Getting Help

1. **Documentation**: See `docs/` directory
2. **Troubleshooting Guide**: `docs/troubleshooting.md`
3. **Issue Tracker**: GitHub Issues
4. **Community**: EduQuest Discord/Slack

## Next Steps

1. **Setup Database**: Follow Phase 2 instructions
2. **Configure Railway**: Set up deployment environment
3. **Test Pipeline**: Create a pull request to test CI
4. **Deploy**: Merge to main for auto-deployment
5. **Monitor**: Set up monitoring and alerts

## Quick Reference Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm test             # Run tests
npm run lint         # Check code style

# Deployment
railway up           # Deploy to Railway
railway logs         # View deployment logs
railway rollback     # Rollback deployment

# Database
supabase status      # Check Supabase status
supabase db push     # Apply migrations
```

## Performance Targets

- **LCP**: < 2.5 seconds
- **Deployment Time**: < 5 minutes
- **Error Rate**: < 0.1%
- **Uptime**: 99.9%

## Security Best Practices

1. Never commit secrets to git
2. Use environment variables for sensitive data
3. Enable Railway automatic HTTPS
4. Implement proper CORS policies
5. Use Supabase RLS for data access control

---

For more detailed information, see the specific documentation files in the `docs/` directory.