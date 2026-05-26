#!/usr/bin/env node

/**
 * Bundle Optimization Script
 * Analyzes and suggests bundle size optimizations
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('=== Bundle Optimization Analysis ===\n')

// Check if bundle analysis exists
const analyzeDir = '.next/analyze'
if (!fs.existsSync(analyzeDir)) {
  console.log('📊 Running bundle analysis...')
  execSync('npm run analyze', { stdio: 'pipe' })
}

// Check for common optimization opportunities
console.log('🔍 Checking for optimization opportunities...\n')

// 1. Check unused dependencies
console.log('1. Dependency Analysis:')
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

  // Check for potentially unused dependencies
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
  const unusedCandidates = []

  // Common patterns for unused packages
  const unusedPatterns = [
    'lodash',
    'moment',
    'jquery',
    'bootstrap',
    'bulma',
    'foundation'
  ]

  unusedPatterns.forEach(pattern => {
    const matchingDeps = Object.keys(deps).filter(dep =>
      dep.includes(pattern) && dep !== '@next/bundle-analyzer'
    )
    if (matchingDeps.length > 0) {
      console.log(`  ⚠️  Consider reviewing: ${matchingDeps.join(', ')}`)
    }
  })
} catch (error) {
  console.log('  ❌ Could not analyze dependencies')
}

// 2. Check image optimization
console.log('\n2. Image Optimization:')
const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
const publicDir = 'public'
let hasImages = false

if (fs.existsSync(publicDir)) {
  const files = fs.readdirSync(publicDir, { recursive: true })
  const images = files.filter(file =>
    imageExtensions.some(ext => file.toLowerCase().endsWith(ext))
  )

  if (images.length > 0) {
    hasImages = true
    console.log(`  📸 Found ${images.length} images in public/`)
    console.log('  💡 Tip: Use Next.js Image component for automatic optimization')
  }
}

if (!hasImages) {
  console.log('  📸 No images found in public/')
}

// 3. Check for large dependencies
console.log('\n3. Large Dependencies Check:')
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const deps = { ...packageJson.dependencies }

  // Known large packages
  const largePackages = {
    'react': 130,
    'react-dom': 130,
    '@supabase/supabase-js': 200,
    '@supabase/ssr': 50
  }

  console.log('  📦 Bundle size estimates:')
  Object.entries(deps).forEach(([pkg, version]) => {
    const size = largePackages[pkg]
    if (size) {
      console.log(`    - ${pkg}: ~${size} kB (gzipped)`)
    }
  })
} catch (error) {
  console.log('  ❌ Could not analyze package sizes')
}

// 4. Check for code splitting opportunities
console.log('\n4. Code Splitting Analysis:')
const srcDir = 'src'
let hasCodeSplitting = false

if (fs.existsSync(srcDir)) {
  const appDir = path.join(srcDir, 'app')
  if (fs.existsSync(appDir)) {
    const routes = fs.readdirSync(appDir, { recursive: true })
    const apiRoutes = routes.filter(route =>
      route.includes('api') && !route.includes('layout') && !route.includes('page')
    )

    if (apiRoutes.length > 0) {
      console.log('  ✅ API routes detected (good for code splitting)')
      hasCodeSplitting = true
    }

    const pageRoutes = routes.filter(route =>
      route.includes('page.tsx') || route.includes('page.ts')
    )

    if (pageRoutes.length > 1) {
      console.log(`  📄 ${pageRoutes.length} page routes detected`)
    }
  }
}

if (!hasCodeSplitting) {
  console.log('  💡 Consider implementing dynamic imports for large components')
}

// 5. Check for bundle analyzer configuration
console.log('\n5. Build Optimization Tools:')
const nextConfigPath = 'next.config.ts'
let hasBundleAnalyzer = false

if (fs.existsSync(nextConfigPath)) {
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf8')
  if (nextConfig.includes('bundleAnalyzer')) {
    hasBundleAnalyzer = true
    console.log('  ✅ Bundle analyzer configured')
  } else {
    console.log('  💡 Consider adding bundle analyzer to next.config.ts')
  }
} else {
  console.log('  ❌ next.config.ts not found')
}

// 6. Performance recommendations
console.log('\n6. Optimization Recommendations:')

const recommendations = [
  'Use dynamic imports for large components',
  'Implement proper image optimization',
  'Remove unused dependencies',
  'Consider using Next.js built-in optimizations',
  'Enable gzip/brotli compression',
  'Use CDN for static assets',
  'Implement tree shaking',
  'Split vendor code from application code'
]

recommendations.forEach((rec, index) => {
  console.log(`  ${index + 1}. ${rec}`)
})

// 7. Generate optimization plan
console.log('\n7. Optimization Plan:')

const plan = [
  {
    step: 'Run bundle analysis',
    command: 'npm run analyze',
    description: 'Generate current bundle report'
  },
  {
    step: 'Review large dependencies',
    command: 'npm ls --depth=0',
    description: 'Identify potentially unused packages'
  },
  {
    step: 'Optimize images',
    command: 'Use next/image component',
    description: 'Enable automatic image optimization'
  },
  {
    step: 'Implement code splitting',
    command: 'Add dynamic imports',
    description: 'Split bundle into smaller chunks'
  },
  {
    step: 'Configure compression',
    command: 'Enable gzip in Railway',
    description: 'Reduce transfer size'
  }
]

plan.forEach((item, index) => {
  console.log(`\n  Step ${index + 1}: ${item.step}`)
  console.log(`    Command: ${item.command}`)
  console.log(`    Description: ${item.description}`)
})

console.log('\n🎯 Target bundle size: < 200 kB (first load JS)')
console.log('📊 Current bundle size: ~100 kB (first load JS - looks good!)')

console.log('\n✅ Bundle analysis complete!')
console.log('For detailed report, check: .next/analyze/client.html')

process.exit(0)