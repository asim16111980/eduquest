#!/usr/bin/env node

/**
 * Quickstart Verification Script
 * Verifies that the EduQuest admin dashboard setup is working correctly
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

function runCommand(command, description, allowFailure = false) {
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
    if (allowFailure) {
      console.log(chalk.yellow(`⚠️  ${description} failed (non-critical)`))
      return null
    } else {
      console.error(chalk.red(`❌ ${description} failed`))
      console.error(error.message)
      process.exit(1)
    }
  }
}

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(chalk.green(`✅ ${description} exists`))
    return true
  } else {
    console.error(chalk.red(`❌ ${description} missing`))
    return false
  }
}

function checkPackageJson() {
  console.log(chalk.bold('\n📦 Checking Package.json\n'))

  if (!fs.existsSync('package.json')) {
    console.error(chalk.red('❌ package.json not found'))
    process.exit(1)
  }

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

  // Check required dependencies
  const requiredDeps = ['next', 'react', 'react-dom', '@supabase/supabase-js', '@supabase/ssr']
  const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies?.[dep])

  if (missingDeps.length > 0) {
    console.error(chalk.red(`❌ Missing dependencies: ${missingDeps.join(', ')}`))
    process.exit(1)
  }

  console.log(chalk.green('✅ All required dependencies are installed'))

  // Check required scripts
  const requiredScripts = ['dev', 'build', 'start', 'lint']
  const missingScripts = requiredScripts.filter(script => !packageJson.scripts?.[script])

  if (missingScripts.length > 0) {
    console.error(chalk.red(`❌ Missing scripts: ${missingScripts.join(', ')}`))
    process.exit(1)
  }

  console.log(chalk.green('✅ All required scripts are defined'))
}

function checkTypeScriptConfig() {
  console.log(chalk.bold('\n📝 Checking TypeScript Configuration\n'))

  const tsconfigPath = 'tsconfig.json'
  if (!checkFileExists(tsconfigPath, 'tsconfig.json')) {
    process.exit(1)
  }

  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'))

  // Check path aliases
  if (!tsconfig.compilerOptions?.paths?.['@/*']) {
    console.error(chalk.red('❌ Path alias @/* not configured in tsconfig.json'))
    process.exit(1)
  }

  console.log(chalk.green('✅ TypeScript path aliases configured correctly'))
}

function checkProjectStructure() {
  console.log(chalk.bold('\n📁 Checking Project Structure\n'))

  const requiredDirs = [
    'src/app',
    'src/app/(auth)',
    'src/app/(dashboard)',
    'src/components',
    'src/components/shared',
    'src/lib',
    'src/lib/supabase',
    'src/lib/types',
    'src/styles',
    '.github/workflows'
  ]

  const missingDirs = requiredDirs.filter(dir => !fs.existsSync(dir))

  if (missingDirs.length > 0) {
    console.error(chalk.red(`❌ Missing directories: ${missingDirs.join(', ')}`))
    process.exit(1)
  }

  console.log(chalk.green('✅ All required directories exist'))
}

function checkEnvironmentFiles() {
  console.log(chalk.bold('\n🔐 Checking Environment Files\n'))

  const envTemplatePath = '.env.local.template'
  if (!checkFileExists(envTemplatePath, 'Environment template')) {
    console.warn(chalk.yellow('⚠️  Environment template not found, but continuing...'))
    return
  }

  // Check if required variables are defined in template
  const envTemplate = fs.readFileSync(envTemplatePath, 'utf8')
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']

  const missingVars = requiredVars.filter(varName => !envTemplate.includes(varName))

  if (missingVars.length > 0) {
    console.error(chalk.red(`❌ Missing required variables in template: ${missingVars.join(', ')}`))
    process.exit(1)
  }

  console.log(chalk.green('✅ Environment template contains all required variables'))
}

function checkSupabaseClients() {
  console.log(chalk.bold('\n🔗 Checking Supabase Client Files\n'))

  const serverClientPath = 'src/lib/supabase/server.ts'
  const clientPath = 'src/lib/supabase/client.ts'
  const middlewarePath = 'src/lib/supabase/middleware.ts'

  if (!checkFileExists(serverClientPath, 'Server client')) return
  if (!checkFileExists(clientPath, 'Browser client')) return
  if (!checkFileExists(middlewarePath, 'Auth middleware')) return

  // Check server client exports
  const serverClient = fs.readFileSync(serverClientPath, 'utf8')
  if (!serverClient.includes('createClient')) {
    console.error(chalk.red('❌ Server client missing createClient export'))
    process.exit(1)
  }

  // Check client exports
  const client = fs.readFileSync(clientPath, 'utf8')
  if (!client.includes('createClient')) {
    console.error(chalk.red('❌ Browser client missing createClient export'))
    process.exit(1)
  }

  console.log(chalk.green('✅ All Supabase client files are properly configured'))
}

function runTypeCheck() {
  console.log(chalk.bold('\n🔍 Running TypeScript Type Check\n'))

  try {
    execSync('npx tsc --noEmit', {
      encoding: 'utf8',
      stdio: 'inherit'
    })
    console.log(chalk.green('✅ TypeScript type check passed'))
  } catch (error) {
    console.error(chalk.red('❌ TypeScript type check failed'))
    console.error(error.message)
    process.exit(1)
  }
}

function runLint() {
  console.log(chalk.bold('\n🎨 Running ESLint\n'))

  try {
    execSync('npm run lint', {
      encoding: 'utf8',
      stdio: 'inherit'
    })
    console.log(chalk.green('✅ ESLint passed'))
  } catch (error) {
    console.error(chalk.red('❌ ESLint failed'))
    console.error(error.message)
    process.exit(1)
  }
}

function runBuild() {
  console.log(chalk.bold('\n🏗️  Running Build\n'))

  try {
    execSync('npm run build', {
      encoding: 'utf8',
      stdio: 'inherit'
    })
    console.log(chalk.green('✅ Build completed successfully'))
  } catch (error) {
    console.error(chalk.red('❌ Build failed'))
    console.error(error.message)
    process.exit(1)
  }
}

async function main() {
  console.log(chalk.bold.cyan('🚀 EduQuest Admin Dashboard - Quickstart Verification\n'))
  console.log(chalk.gray('This script verifies that your setup is working correctly...\n'))

  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    console.error(chalk.red('❌ Please run this script from the project root directory'))
    process.exit(1)
  }

  try {
    // Run all checks
    checkPackageJson()
    checkTypeScriptConfig()
    checkProjectStructure()
    checkEnvironmentFiles()
    checkSupabaseClients()
    runTypeCheck()
    runLint()
    runBuild()

    console.log(chalk.bold('\n🎉 Quickstart verification completed successfully!\n'))
    console.log(chalk.green('Your EduQuest admin dashboard is ready to use.'))
    console.log('\nNext steps:')
    console.log('1. Set up your Supabase project')
    console.log('2. Configure environment variables')
    console.log('3. Run the application with `npm run dev`')
    console.log('4. Set up Railway deployment')

  } catch (error) {
    console.error(chalk.red('\n❌ Verification failed'))
    console.error('Please fix the errors above and try again.')
    process.exit(1)
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main()
}

module.exports = {
  runCommand,
  checkFileExists,
  checkPackageJson,
  checkTypeScriptConfig,
  checkProjectStructure,
  checkEnvironmentFiles,
  checkSupabaseClients,
  runTypeCheck,
  runLint,
  runBuild
}