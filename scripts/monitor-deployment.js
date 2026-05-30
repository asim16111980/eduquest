#!/usr/bin/env node

/**
 * Monitor Railway deployment time
 * Tracks deployment duration from start to completion
 */

const https = require('https')
const { URL } = require('url')

/**
 * Configuration
 */
const config = {
  railwayApiToken: process.env.RAILWAY_API_TOKEN,
  projectId: process.env.RAILWAY_PROJECT_ID,
  maxWaitTime: 300000, // 5 minutes in milliseconds
  checkInterval: 10000, // Check every 10 seconds
  timeout: 5000,
}

/**
 * Railway API client
 */
class RailwayClient {
  constructor(token) {
    this.token = token
    this.baseUrl = 'https://backboard.railway.app/graphql/v2'
  }

  async query(query, variables = {}) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    })

    const data = await response.json()

    if (data.errors) {
      throw new Error(data.errors[0].message)
    }

    return data.data
  }

  async getCurrentDeployments() {
    const query = `
      query GetCurrentDeployments($projectId: ID!) {
        project(id: $projectId) {
          currentDeployments {
            id
            createdAt
            status
            service {
              name
            }
            environment {
              name
            }
          }
        }
      }
    `

    const data = await this.query(query, {
      projectId: this.projectId
    })

    return data.project.currentDeployments
  }
}

/**
 * Deployment Monitor
 */
class DeploymentMonitor {
  constructor() {
    this.startTime = null
    this.deploymentId = null
    this.railway = new RailwayClient(config.railwayApiToken)
  }

  async startMonitoring() {
    console.log('🚀 Starting deployment monitoring...')
    console.log(`⏱️  Will wait up to ${config.maxWaitTime / 1000} seconds for deployment to complete`)

    // Get current deployments
    const deployments = await this.railway.getCurrentDeployments()

    if (deployments.length === 0) {
      console.log('❌ No active deployments found')
      return false
    }

    // Find the deployment we want to monitor
    const deployment = deployments[0]
    this.deploymentId = deployment.id
    this.startTime = new Date(deployment.createdAt)

    console.log(`📋 Monitoring deployment: ${deployment.id}`)
    console.log(`🕐 Started at: ${this.startTime.toISOString()}`)
    console.log(`📄 Status: ${deployment.status}`)
    console.log(`🏗️  Service: ${deployment.service.name}`)
    console.log(`🌍 Environment: ${deployment.environment.name}`)

    // Wait for deployment to complete
    return this.waitForCompletion()
  }

  async waitForCompletion() {
    return new Promise((resolve) => {
      let elapsedTime = 0

      const checkInterval = setInterval(async () => {
        elapsedTime += config.checkInterval

        try {
          const deployments = await this.railway.getCurrentDeployments()
          const currentDeployment = deployments.find(d => d.id === this.deploymentId)

          if (!currentDeployment) {
            console.log('❌ Deployment not found - may have been deleted')
            clearInterval(checkInterval)
            resolve(false)
            return
          }

          const currentTime = new Date()
          const totalTime = (currentTime - this.startTime) / 1000

          console.log(`⏱️  Time elapsed: ${totalTime.toFixed(0)}s | Status: ${currentDeployment.status}`)

          if (currentDeployment.status === 'SUCCESS' || currentDeployment.status === 'FAILED') {
            clearInterval(checkInterval)
            this.reportCompletion(currentDeployment, totalTime)
            resolve(currentDeployment.status === 'SUCCESS')
          }

          if (elapsedTime >= config.maxWaitTime) {
            clearInterval(checkInterval)
            console.log(`⏰ Timeout reached after ${config.maxWaitTime / 1000} seconds`)
            resolve(false)
          }

        } catch (error) {
          console.error(`❌ Error checking deployment: ${error.message}`)
          clearInterval(checkInterval)
          resolve(false)
        }
      }, config.checkInterval)
    })
  }

  reportCompletion(deployment, totalTime) {
    console.log('\n📊 Deployment Summary:')
    console.log(`⏱️  Total Time: ${totalTime.toFixed(2)} seconds`)
    console.log(`✅ Status: ${deployment.status}`)
    console.log(`📄 Deployment ID: ${deployment.id}`)
    console.log(`🏗️  Service: ${deployment.service.name}`)

    if (deployment.status === 'SUCCESS') {
      if (totalTime <= 300) {
        console.log('🎉 Deployment completed within 5 minutes!')
      } else {
        console.log('⚠️  Deployment took longer than 5 minutes')
      }
    } else {
      console.log('❌ Deployment failed')
    }
  }
}

/**
 * Main execution
 */
async function main() {
  if (!config.railwayApiToken) {
    console.error('❌ RAILWAY_API_TOKEN environment variable is required')
    process.exit(1)
  }

  if (!config.projectId) {
    console.error('❌ RAILWAY_PROJECT_ID environment variable is required')
    process.exit(1)
  }

  const monitor = new DeploymentMonitor()
  const success = await monitor.startMonitoring()

  if (success) {
    console.log('\n✅ Deployment monitoring completed successfully')
    process.exit(0)
  } else {
    console.log('\n❌ Deployment monitoring failed')
    process.exit(1)
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main()
}

module.exports = { DeploymentMonitor }