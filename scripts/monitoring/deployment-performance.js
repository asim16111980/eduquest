#!/usr/bin/env node

/**
 * Deployment Performance Monitor
 * Tracks and verifies Railway deployment times
 */

const fs = require('fs')
const path = require.path
const { execSync } = require('child_process')

console.log('=== Deployment Performance Monitor ===\n')

// Configuration
const TARGET_MINUTES = 5
const TARGET_SECONDS = TARGET_MINUTES * 60

// Check if deployment history exists
const deploymentHistoryFile = 'deployment-history.json'
let deployments = []

if (fs.existsSync(deploymentHistoryFile)) {
  try {
    deployments = JSON.parse(fs.readFileSync(deploymentHistoryFile, 'utf8'))
    console.log(`✓ Loaded ${deployments.length} past deployments`)
  } catch (error) {
    console.log('⚠ Could not read deployment history, starting fresh')
    deployments = []
  }
} else {
  console.log('📝 No deployment history found, will create new file')
}

// Function to get current Railway deployments
function getRailwayDeployments() {
  try {
    const output = execSync('railway deployments --json', { encoding: 'utf8', stdio: 'pipe' })
    return JSON.parse(output)
  } catch (error) {
    console.log('⚠ Could not fetch Railway deployments')
    return []
  }
}

// Function to analyze deployment performance
function analyzeDeploymentPerformance() {
  console.log('\n=== Deployment Performance Analysis ===')

  // Check recent deployments
  const railwayDeployments = getRailwayDeployments()

  if (railwayDeployments.length === 0) {
    console.log('⚠ No Railway deployments found')
    return false
  }

  // Filter deployments to main branch
  const mainDeployments = railwayDeployments.filter(d => d.branch === 'main')

  if (mainDeployments.length === 0) {
    console.log('⚠ No deployments to main branch found')
    return false
  }

  // Get most recent deployment
  const latestDeployment = mainDeployments[0]
  const deploymentTime = new Date(latestDeployment.createdAt)
  const now = new Date()
  const deploymentAge = (now - deploymentTime) / 1000 // seconds

  console.log(`Most recent deployment:`)
  console.log(`  Created: ${deploymentTime.toISOString()}`)
  console.log(`  Age: ${Math.round(deploymentAge / 60)} minutes ago`)
  console.log(`  Status: ${latestDeployment.status}`)
  console.log(`  Service: ${latestDeployment.service}`)

  // Check if deployment completed within target time
  if (deploymentAge <= TARGET_SECONDS) {
    console.log(`✅ Deployment completed within ${TARGET_MINUTES} minutes target`)

    // Save to history
    deployments.push({
      id: latestDeployment.id,
      createdAt: deploymentTime.toISOString(),
      duration: deploymentAge,
      status: latestDeployment.status,
      timestamp: new Date().toISOString()
    })

    // Keep only last 10 deployments
    if (deployments.length > 10) {
      deployments = deployments.slice(-10)
    }

    fs.writeFileSync(deploymentHistoryFile, JSON.stringify(deployments, null, 2))

    return true
  } else {
    console.log(`❌ Deployment took ${Math.round(deploymentAge / 60)} minutes (exceeds ${TARGET_MINUTES} minute target)`)

    // Save to history anyway
    deployments.push({
      id: latestDeployment.id,
      createdAt: deploymentTime.toISOString(),
      duration: deploymentAge,
      status: latestDeployment.status,
      timestamp: new Date().toISOString()
    })

    if (deployments.length > 10) {
      deployments = deployments.slice(-10)
    }

    fs.writeFileSync(deploymentHistoryFile, JSON.stringify(deployments, null, 2))

    return false
  }
}

// Function to get average deployment time
function getAverageDeploymentTime() {
  if (deployments.length === 0) return null

  const totalDuration = deployments.reduce((sum, d) => sum + d.duration, 0)
  const average = totalDuration / deployments.length

  console.log(`\n=== Historical Performance ===`)
  console.log(`Total deployments tracked: ${deployments.length}`)
  console.log(`Average deployment time: ${Math.round(average / 60)} minutes`)

  // Show performance trend
  if (deployments.length >= 3) {
    const recent = deployments.slice(-3)
    const recentAverage = recent.reduce((sum, d) => sum + d.duration, 0) / 3

    if (recentAverage < average) {
      console.log('📈 Trend: Improving')
    } else if (recentAverage > average) {
      console.log('📉 Trend: Slowing down')
    } else {
      console.log('➡️ Trend: Stable')
    }
  }

  return average
}

// Main analysis
const withinTarget = analyzeDeploymentPerformance()
getAverageDeploymentTime()

// Performance recommendations
console.log('\n=== Performance Recommendations ===')

if (!withinTarget) {
  console.log('To improve deployment performance:')
  console.log('1. Reduce bundle size with:')
  console.log('   npm run analyze')
  console.log('2. Optimize dependencies:')
  console.log('   npm audit fix')
  console.log('3. Use smaller Docker base images')
  console.log('4. Enable Railway caching')
  console.log('5. Consider splitting monolithic deployments')
}

console.log('\n=== Monitoring Setup ===')
console.log('To enable continuous monitoring:')
console.log('1. Set up Railway alerts for deployment time')
console.log('2. Configure Slack/webhook notifications')
console.log('3. Add deployment metrics to Grafana dashboard')
console.log('4. Set up CI pipeline to fail on slow deployments')

process.exit(withinTarget ? 0 : 1)