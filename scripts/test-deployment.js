#!/usr/bin/env node

/**
 * Test script to verify Railway deployment
 * Run this after merging to main branch
 */

const https = require('https')
const { URL } = require('url')

/**
 * Health check configuration
 */
const config = {
  maxRetries: 10,
  retryDelay: 30000, // 30 seconds
  timeout: 5000,
  healthCheckPath: '/api/health',
  expectedStatus: 'healthy',
  expectedDatabase: 'up',
  maxResponseTime: 5000, // 5 seconds max response time
}

/**
 * Make HTTP request with timeout
 */
function makeRequest(url, timeout = config.timeout) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({
            statusCode: res.statusCode,
            data: jsonData,
            responseTime: Date.now() - startTime
          })
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`))
        }
      })
    })

    const startTime = Date.now()

    req.setTimeout(timeout, () => {
      req.destroy()
      reject(new Error(`Request timed out after ${timeout}ms`))
    })

    req.on('error', (error) => {
      reject(error)
    })
  })
}

/**
 * Test Railway deployment health
 */
async function testDeployment(railwayUrl) {
  console.log(`\n🚀 Testing Railway deployment at: ${railwayUrl}`)

  const healthUrl = new URL(config.healthCheckPath, railwayUrl).toString()

  let retryCount = 0
  let lastError = null

  while (retryCount < config.maxRetries) {
    try {
      console.log(`\n📍 Attempt ${retryCount + 1}/${config.maxRetries}`)
      console.log(`🔍 Checking health at: ${healthUrl}`)

      const result = await makeRequest(healthUrl, config.timeout)

      console.log(`✅ HTTP Status: ${result.statusCode}`)
      console.log(`📊 Response Time: ${result.responseTime}ms`)

      if (result.statusCode !== 200) {
        throw new Error(`Unexpected HTTP status: ${result.statusCode}`)
      }

      if (result.data.status !== config.expectedStatus) {
        throw new Error(`Expected status "${config.expectedStatus}" but got "${result.data.status}"`)
      }

      if (result.data.database !== config.expectedDatabase) {
        throw new Error(`Expected database "${config.expectedDatabase}" but got "${result.data.database}"`)
      }

      if (result.responseTime > config.maxResponseTime) {
        console.warn(`⚠️ Response time ${result.responseTime}ms exceeds expected ${config.maxResponseTime}ms`)
      }

      console.log(`\n🎉 Railway deployment is healthy!`)
      console.log(`\n📈 Performance Metrics:`)
      console.log(`   - Status: ${result.data.status}`)
      console.log(`   - Database: ${result.data.database}`)
      console.log(`   - Uptime: ${formatUptime(result.data.uptime || 0)}`)
      console.log(`   - Response Time: ${result.responseTime}ms`)

      if (result.data.memory) {
        console.log(`   - Memory: ${formatMemory(result.data.memory)}`)
      }

      return true

    } catch (error) {
      lastError = error
      console.error(`❌ Error: ${error.message}`)

      if (retryCount < config.maxRetries - 1) {
        console.log(`⏳ Waiting ${config.retryDelay / 1000} seconds before retry...`)
        await new Promise(resolve => setTimeout(resolve, config.retryDelay))
      }

      retryCount++
    }
  }

  console.error(`\n❌ Failed after ${config.maxRetries} attempts`)
  console.error(`Last error: ${lastError.message}`)
  return false
}

/**
 * Format uptime in human readable format
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

/**
 * Format memory usage in human readable format
 */
function formatMemory(memory) {
  const mb = (value) => Math.round(value / 1024 / 1024)
  return `RSS: ${mb(memory.rss)}MB, Heap: ${mb(memory.heapUsed)}MB`
}

/**
 * Main execution
 */
async function main() {
  // Railway URL from environment or command line
  const railwayUrl = process.env.RAILWAY_URL || process.argv[2]

  if (!railwayUrl) {
    console.error('❌ Railway URL is required')
    console.error('Usage: node test-deployment.js <railway-url>')
    console.error('Or set RAILWAY_URL environment variable')
    process.exit(1)
  }

  try {
    const success = await testDeployment(railwayUrl)

    if (success) {
      console.log('\n✅ Deployment test passed!')
      process.exit(0)
    } else {
      console.log('\n❌ Deployment test failed!')
      process.exit(1)
    }
  } catch (error) {
    console.error(`\n❌ Test failed with error: ${error.message}`)
    process.exit(1)
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main()
}

module.exports = { testDeployment }