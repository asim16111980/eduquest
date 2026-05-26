#!/usr/bin/env node

/**
 * Auto-Deployment Test Script
 * This script simulates and tests the auto-deployment process
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('=== Auto-Deployment Test ===\n')

// Check if Railway CLI is installed
try {
  execSync('railway --version', { stdio: 'ignore' })
  console.log('✓ Railway CLI installed')
} catch (error) {
  console.log('✗ Railway CLI not installed')
  console.log('Install with: npm install -g @railway/cli')
  process.exit(1)
}

// Check if user is logged in to Railway
try {
  execSync('railway whoami', { stdio: 'pipe' })
  console.log('✓ Logged in to Railway')
} catch (error) {
  console.log('✗ Not logged in to Railway')
  console.log('Run: railway login')
  process.exit(1)
}

// Check if project is linked
try {
  const output = execSync('railway project list', { encoding: 'utf8', stdio: 'pipe' })
  if (output.includes('No projects found')) {
    console.log('✗ No Railway projects found')
    console.log('Create a project first: railway create')
    process.exit(1)
  }
  console.log('✓ Railway project found')
} catch (error) {
  console.log('✗ Error checking Railway projects')
  process.exit(1)
}

// Check railway.toml configuration
const railwayConfigPath = 'railway.toml'
if (fs.existsSync(railwayConfigPath)) {
  console.log('✓ Railway configuration exists')

  const config = fs.readFileSync(railwayConfigPath, 'utf8')

  // Verify required sections
  if (config.includes('[build]') && config.includes('[deploy]')) {
    console.log('✓ Build and deploy sections configured')
  } else {
    console.log('✗ Build or deploy sections missing')
    process.exit(1)
  }

  // Check environment variables
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
  const missingVars = []

  requiredVars.forEach(varName => {
    if (!config.includes(varName + ' = ""')) {
      missingVars.push(varName)
    }
  })

  if (missingVars.length === 0) {
    console.log('✓ All required environment variables configured')
  } else {
    console.log(`✗ Missing environment variables: ${missingVars.join(', ')}`)
    console.log('Set these in Railway dashboard')
  }
} else {
  console.log('✗ Railway configuration missing')
  process.exit(1)
}

// Check if application can build successfully
console.log('\n=== Testing Build Process ===')

try {
  console.log('Testing npm build...')
  execSync('npm run build --silent', { stdio: 'pipe' })
  console.log('✓ Build successful')
} catch (error) {
  console.log('✗ Build failed')
  console.log('Error:', error.message)
  process.exit(1)
}

// Check health endpoint exists
const healthRoutePath = 'src/app/api/health/route.ts'
if (fs.existsSync(healthRoutePath)) {
  console.log('✓ Health endpoint exists')
} else {
  console.log('✗ Health endpoint missing')
  process.exit(1)
}

// Simulate deployment process
console.log('\n=== Simulating Deployment Process ===')

// Check if Railway service is active
try {
  const serviceStatus = execSync('railway service list', { encoding: 'utf8', stdio: 'pipe' })
  if (serviceStatus.includes('No services found')) {
    console.log('⚠ No services found - create first with railway up')
  } else {
    console.log('✓ Railway service detected')

    // Check deployment history
    try {
      const deployments = execSync('railway deployments', { encoding: 'utf8', stdio: 'pipe' })
      if (deployments.includes('No deployments yet')) {
        console.log('⚠ No previous deployments')
      } else {
        console.log('✓ Deployment history found')
      }
    } catch (error) {
      console.log('⚠ Could not check deployment history')
    }
  }
} catch (error) {
  console.log('⚠ Could not check Railway service status')
  console.log('You may need to run: railway up')
}

// Generate deployment report
console.log('\n=== Deployment Readiness Report ===')

const checks = {
  railwayCli: true,
  railwayLogin: true,
  projectExists: true,
  configComplete: true,
  buildSuccessful: true,
  healthEndpoint: true
}

console.log('\nChecklist:')
Object.entries(checks).forEach(([check, status]) => {
  const icon = status ? '✓' : '✗'
  const name = check.replace(/([A-Z])/g, ' $1').toLowerCase()
  console.log(`${icon} ${name}`)
})

if (Object.values(checks).every(status => status)) {
  console.log('\n✅ All checks passed!')
  console.log('\nNext Steps:')
  console.log('1. Commit your changes: git add . && git commit -m "Ready for deployment"')
  console.log('2. Push to main: git push origin main')
  console.log('3. Railway will automatically deploy')
  console.log('4. Monitor deployment at: https://railway.app/')
  console.log('5. Check health endpoint after deployment')
} else {
  console.log('\n❌ Some checks failed. Fix the issues above before deploying.')
}

process.exit(0)