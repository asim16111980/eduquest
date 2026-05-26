#!/usr/bin/env node

/**
 * Quickstart Verification Script
 * Verifies that all quickstart steps are complete
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('=== EduQuest Quickstart Verification ===\n')

// Checklist results
const checklist = {
  repository: false,
  dependencies: false,
  railwayCli: false,
  railwayLogin: false,
  railwayProject: false,
  envVars: false,
  quickstartDoc: false,
  buildSuccess: false,
  healthEndpoint: false
}

// 1. Check repository setup
try {
  execSync('git rev-parse --git-dir', { stdio: 'ignore' })
  console.log('✓ Git repository initialized')
  checklist.repository = true
} catch (error) {
  console.log('✗ Git repository not found')
}

// 2. Check package.json and dependencies
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  if (packageJson.dependencies && packageJson.dependencies.next) {
    console.log('✓ Package.json with Next.js found')
    checklist.dependencies = true
  } else {
    console.log('✗ Invalid package.json')
  }
} catch (error) {
  console.log('✗ package.json not found')
}

// 3. Check Railway CLI
try {
  execSync('railway --version', { stdio: 'ignore' })
  console.log('✓ Railway CLI installed')
  checklist.railwayCli = true
} catch (error) {
  console.log('✗ Railway CLI not installed')
}

// 4. Check Railway login
try {
  const output = execSync('railway whoami', { encoding: 'utf8', stdio: 'pipe' })
  if (output.trim()) {
    console.log('✓ Logged in to Railway')
    checklist.railwayLogin = true
  }
} catch (error) {
  console.log('✗ Not logged in to Railway')
}

// 5. Check Railway project
try {
  const output = execSync('railway project list', { encoding: 'utf8', stdio: 'pipe' })
  if (output.includes('No projects found')) {
    console.log('⚠ No Railway projects found (run railway init)')
  } else {
    console.log('✓ Railway project exists')
    checklist.railwayProject = true
  }
} catch (error) {
  console.log('⚠ Could not check Railway projects')
}

// 6. Check quickstart documentation
try {
  if (fs.existsSync('docs/quickstart.md')) {
    console.log('✓ Quickstart documentation exists')
    checklist.quickstartDoc = true
  }
} catch (error) {
  console.log('✗ Quickstart documentation missing')
}

// 7. Check build success
try {
  execSync('npm run build --silent', { stdio: 'pipe' })
  console.log('✓ Build successful')
  checklist.buildSuccess = true
} catch (error) {
  console.log('✗ Build failed')
}

// 8. Check health endpoint
try {
  if (fs.existsSync('src/app/api/health/route.ts')) {
    console.log('✓ Health endpoint exists')
    checklist.healthEndpoint = true
  } else {
    console.log('✗ Health endpoint missing')
  }
} catch (error) {
  console.log('✗ Could not check health endpoint')
}

// Summary
console.log('\n=== Quickstart Status ===')
Object.entries(checklist).forEach(([item, status]) => {
  const icon = status ? '✓' : '✗'
  const name = item.replace(/([A-Z])/g, ' $1').toLowerCase()
  console.log(`${icon} ${name}`)
})

const passedItems = Object.values(checklist).filter(status => status).length
const totalItems = Object.keys(checklist).length
const percentage = Math.round((passedItems / totalItems) * 100)

console.log(`\nProgress: ${passedItems}/${totalItems} (${percentage}%)`)

if (percentage === 100) {
  console.log('\n🎉 All quickstart checks passed!')
  console.log('\nNext Steps:')
  console.log('1. Set up Supabase project')
  console.log('2. Add environment variables to Railway')
  console.log('3. Deploy with: railway up')
  console.log('4. Test CI/CD with a pull request')
} else {
  console.log('\n📋 To complete quickstart:')

  if (!checklist.repository) console.log('- Initialize git repository')
  if (!checklist.dependencies) console.log('- Run: npm install')
  if (!checklist.railwayCli) console.log('- Install: npm install -g @railway/cli')
  if (!checklist.railwayLogin) console.log('- Run: railway login')
  if (!checklist.railwayProject) console.log('- Run: railway init')
  if (!checklist.quickstartDoc) console.log('- Quickstart documentation is missing')
  if (!checklist.buildSuccess) console.log('- Fix build errors')
  if (!checklist.healthEndpoint) console.log('- Create health endpoint')
}

console.log('\nFor detailed setup guide, see: docs/setup-guide.md')

process.exit(percentage === 100 ? 0 : 1)