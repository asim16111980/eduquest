#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Security checks to perform
const securityChecks = [
  {
    name: 'Check for hardcoded secrets',
    check: (content) => {
      const patterns = [
        /password\s*[:=]\s*['"][^'"]+['"]/i,
        /secret\s*[:=]\s*['"][^'"]+['"]/i,
        /token\s*[:=]\s*['"][^'"]+['"]/i,
        /key\s*[:=]\s*['"][^'"]+['"]/i,
        /SUPABASE.*KEY\s*[:=]\s*['"][^'"]+['"]/i
      ]

      // Exclude common patterns in error messages and documentation
      const excludePatterns = [
        /Invalid email or password/i,
        /password.*required/i,
        /invalid.*token/i,
        /access.*token/i,
        /API.*key/i,
        /environment.*variable/i
      ]

      // Check if any pattern matches but exclude patterns don't
      const hasSecret = patterns.some(pattern => pattern.test(content))
      const hasExclusion = excludePatterns.some(pattern => pattern.test(content))

      return hasSecret && !hasExclusion
    },
    message: 'Hardcoded secrets found'
  },
  {
    name: 'Check for console.log in production code',
    check: (content) => {
      return /console\.(log|warn|error)/.test(content) && !process.env.NODE_ENV === 'development'
    },
    message: 'Console statements found in non-development code'
  },
  {
    name: 'Check for any types',
    check: (content) => {
      // Look for actual any type usage, not comments or strings
      return /:\s*any\b|any\s*\[|any\s*\{|,\s*any\s*,|\bany\s*\[]/.test(content)
    },
    message: 'any types found - violates constitution'
  },
  {
    name: 'Check for inline styles',
    check: (content) => {
      return /style\s*=\s*['"][^'"]*['"]/.test(content)
    },
    message: 'Inline styles found - violates constitution'
  },
  {
    name: 'Check for ts-ignore comments',
    check: (content) => {
      return /\/\/\s*@ts-ignore/.test(content)
    },
    message: 'ts-ignore comments found without explanation'
  }
]

// Scan directory recursively
function scanDirectory(dir, results = []) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      scanDirectory(filePath, results)
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      scanFile(filePath, results)
    }
  }

  return results
}

// Scan individual file
function scanFile(filePath, results) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')

    for (const check of securityChecks) {
      if (check.check(content)) {
        results.push({
          file: filePath,
          check: check.name,
          message: check.message
        })
      }
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message)
  }
}

// Run security audit
function runAudit() {
  console.log('🔍 Running security audit...')

  const results = scanDirectory('./src')

  if (results.length === 0) {
    console.log('✅ No security issues found!')
    process.exit(0)
  } else {
    console.log('❌ Security issues found:')
    results.forEach(result => {
      console.log(`\n📁 File: ${result.file}`)
      console.log(`🔍 Check: ${result.check}`)
      console.log(`⚠️  Issue: ${result.message}`)
    })
    process.exit(1)
  }
}

// Execute audit
if (require.main === module) {
  runAudit()
}

module.exports = { runAudit, securityChecks }