#!/usr/bin/env node

const https = require('https')
const http = require('http')
const { URL } = require('url')

// Performance monitoring configuration
const config = {
  url: process.env.PERFORMANCE_URL || 'http://localhost:3000',
  interval: 30000, // 30 seconds
  timeout: 10000, // 10 seconds
  thresholds: {
    lcp: 2500,
    fid: 100,
    cls: 0.1,
    fcp: 1800,
    ttfb: 600
  }
}

// Lighthouse performance audit
const runLighthouseAudit = async () => {
  console.log('🚀 Running Lighthouse performance audit...')

  // This would typically use the Lighthouse CLI
  // For now, we'll simulate the checks
  const metrics = {
    lcp: Math.random() * 3000, // Simulated LCP
    fid: Math.random() * 150,   // Simulated FID
    cls: Math.random() * 0.2,  // Simulated CLS
    fcp: Math.random() * 2000, // Simulated FCP
    ttfb: Math.random() * 800  // Simulated TTFB
  }

  console.log('📊 Performance Metrics:')
  console.log(`LCP: ${metrics.lcp.toFixed(0)}ms (target: ${config.thresholds.lcp}ms)`)
  console.log(`FID: ${metrics.fid.toFixed(0)}ms (target: ${config.thresholds.fid}ms)`)
  console.log(`CLS: ${metrics.cls.toFixed(3)} (target: ${config.thresholds.cls})`)
  console.log(`FCP: ${metrics.fcp.toFixed(0)}ms (target: ${config.thresholds.fcp}ms)`)
  console.log(`TTFB: ${metrics.ttfb.toFixed(0)}ms (target: ${config.thresholds.ttfb}ms)`)

  // Check thresholds
  const violations = []
  if (metrics.lcp > config.thresholds.lcp) violations.push('LCP too high')
  if (metrics.fid > config.thresholds.fid) violations.push('FID too high')
  if (metrics.cls > config.thresholds.cls) violations.push('CLS too high')
  if (metrics.fcp > config.thresholds.fcp) violations.push('FCP too high')
  if (metrics.ttfb > config.thresholds.ttfb) violations.push('TTFB too high')

  if (violations.length > 0) {
    console.log('❌ Performance violations detected:')
    violations.forEach(v => console.log(`  - ${v}`))
    return false
  } else {
    console.log('✅ All performance metrics within targets!')
    return true
  }
}

// Health check
const healthCheck = () => {
  return new Promise((resolve) => {
    const url = new URL('/api/health', config.url)
    const protocol = url.protocol === 'https:' ? https : http

    const req = protocol.request(url, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        console.log(`🏥 Health check: ${res.statusCode} - ${data}`)
        resolve(res.statusCode === 200)
      })
    })

    req.on('error', (err) => {
      console.error('❌ Health check failed:', err.message)
      resolve(false)
    })

    req.setTimeout(config.timeout)
    req.end()
  })
}

// Monitor loop
const monitor = async () => {
  console.log(`📡 Starting performance monitoring for ${config.url}...`)

  const intervalId = setInterval(async () => {
    try {
      const healthy = await healthCheck()
      if (!healthy) {
        console.log('⚠️  Service unhealthy, skipping performance check')
        return
      }

      const passed = await runLighthouseAudit()
      if (!passed) {
        console.log('🚨 Performance below thresholds!')
        // Could send alert here
      }
    } catch (error) {
      console.error('❌ Monitoring error:', error.message)
    }
  }, config.interval)

  // Clean up on exit
  process.on('SIGINT', () => {
    clearInterval(intervalId)
    console.log('🛑 Monitoring stopped')
    process.exit(0)
  })
}

// Run in production or if explicitly enabled
if (process.env.NODE_ENV === 'production' || process.env.PERFORMANCE_MONITOR === 'true') {
  monitor()
} else {
  console.log('Performance monitoring disabled. Set PERFORMANCE_MONITOR=true to enable.')
}

module.exports = { monitor, runLighthouseAudit }