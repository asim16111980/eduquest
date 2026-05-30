#!/usr/bin/env node

/**
 * Load Testing Script for EduQuest Admin Dashboard
 * Simulates 100 concurrent users to test performance
 */

const { execSync } = require('child_process')
const https = require('https')
const http = require('http')
const { performance } = require('perf_hooks')

class LoadTester {
  constructor(options = {}) {
    this.url = options.url || 'http://localhost:3000'
    this.concurrentUsers = options.concurrentUsers || 100
    this.duration = options.duration || 60 // seconds
    this.requestInterval = options.requestInterval || 1000 // ms
    this.timeout = options.timeout || 5000 // ms

    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeouts: 0,
      errors: [],
      responseTimes: [],
      startTime: 0,
      endTime: 0
    }
  }

  async run() {
    console.log(`🚀 Starting load test with ${this.concurrentUsers} concurrent users for ${this.duration} seconds`)
    console.log(`📊 Target URL: ${this.url}`)
    console.log(`⏱️  Request interval: ${this.requestInterval}ms`)
    console.log(`⏱️  Timeout: ${this.timeout}ms`)
    console.log('\n----------------------------------------\n')

    this.results.startTime = performance.now()
    const endTime = this.results.startTime + (this.duration * 1000)

    // Create user promises
    const userPromises = []
    for (let i = 0; i < this.concurrentUsers; i++) {
      userPromises.push(this.simulateUser(endTime, i))
    }

    // Wait for all users to complete
    await Promise.allSettled(userPromises)

    this.results.endTime = performance.now()

    // Generate report
    this.generateReport()
  }

  async simulateUser(endTime, userId) {
    while (performance.now() < endTime) {
      const requestStart = performance.now()

      try {
        await this.makeRequest()
        this.results.successfulRequests++
      } catch (error) {
        this.results.failedRequests++
        if (error.code === 'ETIMEOUT') {
          this.results.timeouts++
        }
        this.results.errors.push({
          userId,
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }

      this.results.totalRequests++

      // Record response time
      const responseTime = performance.now() - requestStart
      this.results.responseTimes.push(responseTime)

      // Wait before next request
      await this.sleep(this.requestInterval + Math.random() * 500)
    }
  }

  makeRequest() {
    return new Promise((resolve, reject) => {
      const url = this.url
      const protocol = url.startsWith('https') ? https : http

      const options = {
        method: 'GET',
        timeout: this.timeout
      }

      const req = protocol.request(url, options, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            resolve(res)
          } else {
            reject(new Error(`HTTP ${res.statusCode}`))
          }
        })
      })

      req.on('error', (error) => {
        reject(error)
      })

      req.on('timeout', () => {
        req.destroy()
        reject(new Error('ETIMEOUT'))
      })

      req.end()
    })
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  generateReport() {
    const duration = (this.results.endTime - this.results.startTime) / 1000
    const avgResponseTime = this.results.responseTimes.length > 0
      ? this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length
      : 0

    const minResponseTime = this.results.responseTimes.length > 0
      ? Math.min(...this.results.responseTimes)
      : 0

    const maxResponseTime = this.results.responseTimes.length > 0
      ? Math.max(...this.results.responseTimes)
      : 0

    const throughput = this.results.totalRequests / duration
    const successRate = (this.results.successfulRequests / this.results.totalRequests) * 100

    console.log('\n📊 Load Test Results\n')
    console.log('========================================')
    console.log(`Duration: ${duration.toFixed(2)} seconds`)
    console.log(`Concurrent Users: ${this.concurrentUsers}`)
    console.log(`Total Requests: ${this.results.totalRequests}`)
    console.log(`Successful Requests: ${this.results.successfulRequests}`)
    console.log(`Failed Requests: ${this.results.failedRequests}`)
    console.log(`Timeouts: ${this.results.timeouts}`)
    console.log(`Success Rate: ${successRate.toFixed(2)}%`)
    console.log(`Throughput: ${throughput.toFixed(2)} req/sec`)
    console.log('========================================')
    console.log('\n⏱️  Response Times:')
    console.log(`Average: ${avgResponseTime.toFixed(2)}ms`)
    console.log(`Minimum: ${minResponseTime.toFixed(2)}ms`)
    console.log(`Maximum: ${maxResponseTime.toFixed(2)}ms`)

    // Performance assessment
    console.log('\n🎯 Performance Assessment:')
    if (avgResponseTime < 200) {
      console.log('✅ Excellent response time (< 200ms)')
    } else if (avgResponseTime < 500) {
      console.log('✅ Good response time (< 500ms)')
    } else if (avgResponseTime < 1000) {
      console.log('⚠️  Acceptable response time (< 1000ms)')
    } else {
      console.log('❌ Poor response time (> 1000ms)')
    }

    if (successRate >= 99) {
      console.log('✅ Excellent success rate (≥ 99%)')
    } else if (successRate >= 95) {
      console.log('✅ Good success rate (≥ 95%)')
    } else if (successRate >= 90) {
      console.log('⚠️  Acceptable success rate (≥ 90%)')
    } else {
      console.log('❌ Poor success rate (< 90%)')
    }

    if (this.results.errors.length > 0) {
      console.log('\n❌ Recent Errors (last 5):')
      this.results.errors.slice(-5).forEach(error => {
        console.log(`  - User ${error.userId}: ${error.error}`)
      })
    }

    console.log('\n🎉 Load test completed!')
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2)
  const options = {}

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '--url':
        options.url = args[++i]
        break
      case '--users':
        options.concurrentUsers = parseInt(args[++i], 10)
        break
      case '--duration':
        options.duration = parseInt(args[++i], 10)
        break
      case '--interval':
        options.requestInterval = parseInt(args[++i], 10)
        break
      case '--timeout':
        options.timeout = parseInt(args[++i], 10)
        break
      case '--help':
        console.log(`
Load Testing Script for EduQuest Admin Dashboard

Usage: node load-test.js [options]

Options:
  --url <URL>           Target URL (default: http://localhost:3000)
  --users <number>      Number of concurrent users (default: 100)
  --duration <seconds>  Test duration in seconds (default: 60)
  --interval <ms>       Request interval in milliseconds (default: 1000)
  --timeout <ms>        Request timeout in milliseconds (default: 5000)
  --help               Show this help message

Examples:
  node load-test.js --url https://eduquest-admin.railway.app
  node load-test.js --users 200 --duration 120
        `)
        process.exit(0)
    }
  }

  // Run load test
  const tester = new LoadTester(options)
  tester.run().catch(error => {
    console.error('Load test failed:', error)
    process.exit(1)
  })
}

module.exports = LoadTester