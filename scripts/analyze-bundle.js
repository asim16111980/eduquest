#!/usr/bin/env node

/**
 * Bundle size analysis script for EduQuest Admin Dashboard
 * Uses Next.js bundle analyzer to generate report
 */

const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')

/**
 * Configuration
 */
const config = {
  buildDir: path.join(__dirname, '../.next'),
  reportDir: path.join(__dirname, '../bundle-analysis'),
  maxBundleSize: 500000, // 500KB in bytes
  maxChunkCount: 20,
  criticalPaths: [
    'src/app/(auth)/login/page.tsx',
    'src/app/(dashboard)/monitoring/page.tsx',
    'src/components/shared/LoginForm.tsx',
  ],
}

/**
 * Main function
 */
function main() {
  console.log('📊 Starting bundle analysis...\n')

  try {
    // Ensure build directory exists
    if (!fs.existsSync(config.buildDir)) {
      console.log('🏗️  Building application...')
      execSync('npm run build', { stdio: 'inherit' })
    }

    // Create report directory
    if (!fs.existsSync(config.reportDir)) {
      fs.mkdirSync(config.reportDir, { recursive: true })
    }

    // Run bundle analyzer
    console.log('🔍 Running Next.js Bundle Analyzer...')
    execSync('npx next build', { stdio: 'inherit' })

    // Analyze bundle size
    analyzeBundleSize()

    // Generate report
    generateReport()

    console.log('\n✅ Bundle analysis complete!')
    console.log(`📄 Report saved to: ${config.reportDir}`)

  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message)
    process.exit(1)
  }
}

/**
 * Analyze bundle size and check thresholds
 */
function analyzeBundleSize() {
  console.log('\n📊 Analyzing bundle size...')

  const statsPath = path.join(config.buildDir, 'stats.json')
  if (!fs.existsSync(statsPath)) {
    console.warn('⚠️  Stats file not found, skipping size analysis')
    return
  }

  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'))
  const chunks = stats.chunks || []

  // Calculate total size
  let totalSize = 0
  const chunkSizes = []

  chunks.forEach(chunk => {
    if (chunk.files) {
      chunk.files.forEach(file => {
        const filePath = path.join(config.buildDir, file)
        if (fs.existsSync(filePath)) {
          const size = fs.statSync(filePath).size
          totalSize += size
          chunkSizes.push({ file, size })
        }
      })
    }
  })

  // Check thresholds
  console.log(`\n📈 Bundle Size Report:`)
  console.log(`   Total Size: ${formatBytes(totalSize)}`)

  if (totalSize > config.maxBundleSize) {
    console.warn(`   ⚠️  Exceeds max size of ${formatBytes(config.maxBundleSize)}`)
  } else {
    console.log(`   ✅ Within size limit`)
  }

  console.log(`   Number of Chunks: ${chunks.length}`)

  if (chunks.length > config.maxChunkCount) {
    console.warn(`   ⚠️  Too many chunks (max: ${config.maxChunkCount})`)
  } else {
    console.log(`   ✅ Chunk count acceptable`)
  }

  // Show largest chunks
  console.log('\n📦 Largest Chunks:')
  chunkSizes
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .forEach(({ file, size }) => {
      console.log(`   ${file}: ${formatBytes(size)}`)
    })

  return { totalSize, chunkCount: chunks.length }
}

/**
 * Generate optimization report
 */
function generateReport() {
  const reportPath = path.join(config.reportDir, 'bundle-report.md')
  const timestamp = new Date().toISOString()

  const report = `# Bundle Analysis Report

**Generated**: ${timestamp}
**Project**: EduQuest Admin Dashboard

## Summary

This report provides an analysis of the application bundle size and identifies optimization opportunities.

## Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Total Size | [TOTAL_SIZE] | [SIZE_STATUS] |
| Chunk Count | [CHUNK_COUNT] | [CHUNK_STATUS] |
| Largest File | [LARGEST_FILE] | [LARGEST_SIZE] |

## Files Over 50KB

[LARGE_FILES_LIST]

## Optimization Recommendations

1. **Code Splitting**
   - Implement dynamic imports for large components
   - Route-based code splitting already implemented

2. **Image Optimization**
   - Use Next.js Image component for all images
   - Compress images before upload

3. **Third-party Libraries**
   - Replace heavy libraries with lighter alternatives
   - Tree-shake unused code

4. **CSS Optimization**
   - Remove unused CSS with PurgeCSS
   - Use CSS modules instead of global styles

5. **Caching**
   - Implement proper caching headers
   - Use Service Worker for static assets

## Critical Path Analysis

[Critical paths analysis would go here]

## Next Steps

1. Review large chunks and consider code splitting
2. Optimize images and static assets
3. Remove unused dependencies
4. Implement lazy loading for non-critical components

---

*This report was generated automatically by the bundle analysis script.*
`

  // Replace placeholders with actual values
  const bundleInfo = analyzeBundleSize()
  const reportWithValues = report
    .replace('[TOTAL_SIZE]', bundleInfo ? formatBytes(bundleInfo.totalSize) : 'N/A')
    .replace('[SIZE_STATUS]', bundleInfo && bundleInfo.totalSize > config.maxBundleSize ? '⚠️ Too Large' : '✅ OK')
    .replace('[CHUNK_COUNT]', bundleInfo ? bundleInfo.chunkCount.toString() : 'N/A')
    .replace('[CHUNK_STATUS]', bundleInfo && bundleInfo.chunkCount > config.maxChunkCount ? '⚠️ Too Many' : '✅ OK')

  fs.writeFileSync(reportPath, reportWithValues)
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Run if this file is executed directly
if (require.main === module) {
  main()
}

module.exports = { analyzeBundleSize, generateReport }