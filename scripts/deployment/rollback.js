#!/usr/bin/env node

/**
 * Railway Deployment Rollback Script
 * Rolls back to the previous successful deployment
 */

const { execSync } = require('child_process')
const chalk = require('chalk')

function runCommand(command, description) {
  try {
    console.log(chalk.blue(`\n${description}...`))
    console.log(chalk.gray(`$ ${command}`))

    const result = execSync(command, {
      encoding: 'utf8',
      stdio: 'inherit'
    })

    console.log(chalk.green(`✅ ${description} completed`))
    return result
  } catch (error) {
    console.error(chalk.red(`❌ ${description} failed`))
    console.error(error.message)
    process.exit(1)
  }
}

async function rollbackDeployment() {
  console.log(chalk.bold('\n🔄 Railway Deployment Rollback\n'))

  try {
    // Get current deployment
    console.log(chalk.blue('Getting current deployment information...'))
    const deployments = JSON.parse(
      execSync('railway deployments --json', { encoding: 'utf8' })
    )

    if (!deployments || deployments.length < 2) {
      console.log(chalk.yellow('⚠️  No previous deployment to rollback to'))
      return
    }

    const currentDeployment = deployments[0]
    const previousDeployment = deployments[1]

    console.log(chalk.cyan('\nCurrent deployment:'))
    console.log(`  ID: ${currentDeployment.id}`)
    console.log(`  Service: ${currentDeployment.serviceName}`)
    console.log(`  Status: ${currentDeployment.status}`)

    console.log(chalk.cyan('\nRolling back to:'))
    console.log(`  ID: ${previousDeployment.id}`)
    console.log(`  Service: ${previousDeployment.serviceName}`)
    console.log(`  Created: ${new Date(previousDeployment.createdAt).toLocaleString()}`)

    // Perform rollback
    runCommand(
      `railway deployments rollback --service ${currentDeployment.serviceName} --version ${previousDeployment.id}`,
      'Rolling back deployment'
    )

    // Wait for rollback to complete
    console.log(chalk.blue('\nWaiting for rollback to complete...'))
    await new Promise(resolve => setTimeout(resolve, 30000))

    // Verify rollback
    console.log(chalk.blue('\nVerifying rollback...'))
    const updatedDeployments = JSON.parse(
      execSync('railway deployments --json', { encoding: 'utf8' })
    )

    if (updatedDeployments[0].id === previousDeployment.id) {
      console.log(chalk.green('\n✅ Rollback successful!'))
      console.log(`Now running deployment: ${previousDeployment.id}`)
    } else {
      console.log(chalk.red('\n❌ Rollback verification failed'))
      console.log('Please check Railway dashboard for deployment status')
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Rollback failed:'))
    console.error(error.message)

    // Provide manual rollback instructions
    console.log(chalk.yellow('\n📋 Manual rollback instructions:'))
    console.log('1. Go to Railway dashboard')
    console.log('2. Navigate to Deployments')
    console.log('3. Click "Rollback" on the current deployment')
    console.log('4. Select the previous successful deployment')

    process.exit(1)
  }
}

// Run rollback if script is executed directly
if (require.main === module) {
  rollbackDeployment()
}

module.exports = { rollbackDeployment }