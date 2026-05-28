#!/usr/bin/env node

/**
 * Stress test script for EduQuest Admin Dashboard
 * Simulates 100 concurrent users to test performance
 */

const https = require('https')
const { URL } = require('url')
const { performance } = require('perf_hooks')

/**
 * Configuration
 */
const config = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  concurrentUsers: 100,
  requestsPerUser: 10,
  timeout: 10000, // 10 seconds
  rampUpTime: 5000, // 5 seconds to ramp up users
  testDuration: 30000, // 30 seconds of sustained load
  endpoints: [
    { path: '/api/health', method: 'GET', weight: 20 },
    { path: '/api/test', method: 'GET', weight: 30 },
    { path: '/api/performance', method: 'GET', weight: 50 },
  ],
}

/**
 * Test Results
 */
class TestResults {
  constructor() {
    this.startTime = performance.now()
    this.endTime = null
    this.totalRequests = 0
    this.successfulRequests = 0
    this.failedRequests = 0
    this.responseTimes = []
    this.errors = []
    this.users = []
  }

  addRequest(duration, success, endpoint, userId) {
    this.totalRequests++
    this.responseTimes.push({
      duration,
      success,
      endpoint,
      userId,
      timestamp: performance.now()
    })

    if (success) {
      this.successfulRequests++
    } else {
      this.failedRequests++
    }
  }

  addUserResults(userId, requests) {
    this.users.push({
      userId,
      totalRequests: requests.length,
      successful: requests.filter(r => r.success).length,
      failed: requests.filter(r => !r.success).length,
      averageResponse: requests.reduce((sum, r) => sum + r.duration, 0) / requests.length
    })
  }

  getSummary() {
    const duration = this.endTime - this.startTime
    const averageResponse = this.responseTimes.length > 0
      ? this.responseTimes.reduce((sum, r) => sum + r.duration, 0) / this.responseTimes.length
      : 0

    const successfulRate = this.totalRequests > 0
      ? (this.successfulRequests / this.totalRequests) * 100
      : 0

    // Calculate percentiles
    const sortedTimes = this.responseTimes
      .filter(r => r.success)
      .map(r => r.duration)
      .sort((a, b) => a - b)

    const p95 = this.calculatePercentile(sortedTimes, 95)
    const p99 = this.calculatePercentile(sortedTimes, 99)

    return {
      duration: duration / 1000, // Convert to seconds
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      successRate: successfulRate,
      averageResponseTime: averageResponse,
      p95ResponseTime: p95,
      p99ResponseTime: p99,
      requestsPerSecond: this.totalRequests / (duration / 1000),
      errors: this.errors.length,
      usersTested: this.users.length
    }
  }

  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0
    const index = Math.ceil((percentile / 100) * values.length) - 1
    return values[index] || 0
  }

  generateReport() {
    const summary = this.getSummary()
    const timestamp = new Date().toISOString()

    console.log('\n' + '='.repeat(60))
    console.log('📊 STRESS TEST RESULTS'.padStart(60, ' '))
    console.log('='.repeat(60))
    console.log(`\n📅 Test Time: ${timestamp}`)
    console.log(`⏱️  Duration: ${summary.duration.toFixed(2)} seconds`)
    console.log(`👥 Concurrent Users: ${config.concurrentUsers}`)
    console.log(`📦 Total Requests: ${summary.totalRequests}`)
    console.log(`✅ Successful: ${summary.successfulRequests}`)
    console.log(`❌ Failed: ${summary.failedRequests}`)
    console.log(`📈 Success Rate: ${summary.successRate.toFixed(2)}%`)
    console.log(`🚀 Requests/Second: ${summary.requestsPerSecond.toFixed(2)}`)
    console.log(`⏱️  Avg Response Time: ${summary.averageResponseTime.toFixed(2)}ms`)
    console.log(`📊 P95 Response Time: ${summary.p95ResponseTime.toFixed(2)}ms`)
    console.log(`📊 P99 Response Time: ${summary.p99ResponseTime.toFixed(2)}ms`)
    console.log(`⚠️  Errors: ${summary.errors}`)

    // Performance assessment
    console.log('\n🎯 Performance Assessment:')
    if (summary.averageResponseTime < 200) {
      console.log('   ✅ Excellent - Response times are optimal')
    } else if (summary.averageResponseTime < 500) {
      console.log('   ⚠️  Good - Acceptable response times')
    } else {
      console.log('   ❌ Poor - Response times need optimization')
    }

    if (summary.successRate > 99) {
      console.log('   ✅ Excellent - High success rate')
    } else if (summary.successRate > 95) {
      console.log('   ⚠️  Good - Acceptable error rate')
    } else {
      console.log('   ❌ Poor - High error rate detected')
    }

    // User breakdown
    console.log('\n👥 User Performance Breakdown:')
    this.users.slice(0, 10).forEach(user => {
      console.log(`   User ${user.userId}: ${user.successful}/${user.totalRequests} success, avg: ${user.averageResponse.toFixed(2)}ms`)
    })

    if (this.users.length > 10) {
      console.log(`   ... and ${this.users.length - 10} more users`)
    }

    return summary
  }
}

/**
 * HTTP Request Helper
 */
function makeRequest(url, method = 'GET', timeout = config.timeout) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now()
    let responseData = ''

    const req = https.request(url, { method, timeout }, (res) => {
      res.on('data', (chunk) => {
        responseData += chunk
      })

      res.on('end', () => {
        const endTime = performance.now()
        const duration = endTime - startTime

        resolve({
          success: res.statusCode < 400,
          statusCode: res.statusCode,
          duration,
          size: responseData.length
        })
      })
    })

    req.on('error', (error) => {
      const endTime = performance.now()
      const duration = endTime - startTime

      resolve({
        success: false,
        statusCode: 0,
        duration,
        error: error.message
      })
    })

    req.on('timeout', () => {
      req.destroy()
      const endTime = performance.now()
      const duration = endTime - startTime

      resolve({
        success: false,
        statusCode: 0,
        duration,
        error: 'Request timeout'
      })
    })

    req.end()
  })
}

/**
 * Select random endpoint based on weight
 */
function selectEndpoint() {
  const totalWeight = config.endpoints.reduce((sum, endpoint) => sum + endpoint.weight, 0)
  let random = Math.random() * totalWeight

  for (const endpoint of config.endpoints) {
    random -= endpoint.weight
    if (random <= 0) {
      return endpoint
    }
  }

  return config.endpoints[0]
}

/**
 * Simulate a single user
 */
async function simulateUser(userId, results) {
  const userRequests = []

  for (let i = 0; i < config.requestsPerUser; i++) {
    const endpoint = selectEndpoint()
    const url = new URL(endpoint.path, config.baseUrl).toString()

    try {
      const result = await makeRequest(url, endpoint.method)
      userRequests.push(result)

      results.addRequest(result.duration, result.success, endpoint.path, userId)
    } catch (error) {
      userRequests.push({ success: false, error: error.message })
      results.addRequest(0, false, endpoint.path, userId)
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000))
  }

  results.addUserResults(userId, userRequests)
}

/**
 * Main test function
 */
async function runStressTest() {
  console.log('🚀 Starting stress test...')
  console.log(`📊 Concurrent Users: ${config.concurrentUsers}`)
  console.log(`📦 Requests Per User: ${config.requestsPerUser}`)
  console.log(`⏱️  Test Duration: ${config.testDuration / 1000} seconds`)
  console.log(`🌐 Base URL: ${config.baseUrl}`)
  console.log('\nPress Ctrl+C to stop early\n')

  const results = new TestResults()
  const users = []

  // Ramp up users gradually
  for (let i = 0; i < config.concurrentUsers; i++) {
    const userId = i + 1
    users.push(simulateUser(userId, results))

    // Stagger user creation
    if (i < config.concurrentUsers - 1) {
      await new Promise(resolve => setTimeout(resolve, config.rampUpTime / config.concurrentUsers))
    }
  }

  // Wait for all users to complete
  await Promise.all(users)

  // Run sustained load if specified
  if (config.testDuration > 0) {
    console.log('\n🔥 Sustained load phase...')
    const endTime = performance.now() + config.testDuration

    while (performance.now() < endTime) {
      const userId = Math.floor(Math.random() * config.concurrentUsers) + 1
      const endpoint = selectEndpoint()
      const url = new URL(endpoint.path, config.baseUrl).toString()

      try {
        const result = await makeRequest(url, endpoint.method)
        results.addRequest(result.duration, result.success, endpoint.path, userId)
      } catch (error) {
        results.addRequest(0, false, endpoint.path, userId)
      }

      // Random delay between requests
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500))
    }
  }

  results.endTime = performance.now()

  // Generate report
  const summary = results.generateReport()

  // Save results to file
  const reportData = {
    timestamp: new Date().toISOString(),
    config,
    summary: results.getSummary(),
    endpoints: config.endpoints,
    users: results.users
  }

  require('fs').writeFileSync(
    'stress-test-report.json',
    JSON.stringify(reportData, null, 2)
  )

  console.log('\n📄 Full report saved to: stress-test-report.json')
  console.log('\n✅ Stress test completed!')

  return summary
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test interrupted by user')
  process.exit(0)
})

// Run if this file is executed directly
if (require.main === module) {
  runStressTest().catch(error => {
    console.error('❌ Stress test failed:', error.message)
    process.exit(1)
  })
}

module.exports = { runStressTest, TestResults }