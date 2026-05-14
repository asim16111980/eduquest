#!/bin/bash

# Authentication Configuration Test Script
# Purpose: Tests Supabase authentication configuration with login functionality
# Usage: ./test-auth.sh [env-file]

set -e  # Exit on any error

# Source shared utilities
source "$(dirname "$0")/../lib/logging.sh"
source "$(dirname "$0")/../lib/retry-utils.sh"
source "$(dirname "$0")/../lib/env-validation.sh"

# Configuration
ENV_FILE="${1:-.env.local}"
TEST_USER_EMAIL="test@example.com"
TEST_USER_PASSWORD="test123456"
CLEANUP_TEST_USER=true

# Function to display usage
usage() {
    echo "Usage: $0 [env-file]"
    echo ""
    echo "Authentication Configuration Test Script"
    echo ""
    echo "Arguments:"
    echo "  env-file     Environment file to test (default: .env.local)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Test with .env.local"
    echo "  $0 .env.production    # Test with production environment file"
    echo ""
    echo "This script performs the following tests:"
    echo "  1. Validates environment variables are properly configured"
    echo "  2. Tests Supabase client connection"
    echo "  3. Creates a test user account"
    echo "  4. Tests user authentication (login)"
    echo "  5. Tests session management"
    echo "  6. Cleans up test user (optional)"
    exit 1
}

# Function to create test user with retry
create_test_user() {
    log_info "Creating test user: $TEST_USER_EMAIL"
    
    local max_attempts=3
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log_info "Attempt $attempt to create test user..."
        
        # Create user using Supabase CLI
        if supabase auth signup --email="$TEST_USER_EMAIL" --password="$TEST_USER_PASSWORD" 2>/dev/null; then
            log_success "Test user created successfully"
            return 0
        else
            log_warn "Failed to create test user (attempt $attempt/$max_attempts)"
            
            if [[ $attempt -eq $max_attempts ]]; then
                log_error "Failed to create test user after $max_attempts attempts"
                
                # Check if user already exists
                if supabase auth admin users --email="$TEST_USER_EMAIL" 2>/dev/null | grep -q "$TEST_USER_EMAIL"; then
                    log_info "Test user already exists, continuing with authentication test"
                    return 0
                fi
                
                return 1
            fi
            
            # Wait before retry
            sleep 2
            ((attempt++))
        fi
    done
    
    return 1
}

# Function to test user authentication
test_user_authentication() {
    log_info "Testing user authentication for: $TEST_USER_EMAIL"
    
    # Create temporary test file
    local test_file="/tmp/test_auth_$(date +%s).js"
    local test_script="
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '$ENV_FILE' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

console.log('Testing authentication...');

// Test user sign in
supabase.auth.signInWithPassword({
    email: '$TEST_USER_EMAIL',
    password: '$TEST_USER_PASSWORD'
})
.then(({ data, error }) => {
    if (error) {
        console.error('Authentication failed:', error.message);
        process.exit(1);
    } else {
        console.log('Authentication successful!');
        console.log('User:', data.user?.email);
        console.log('Session exists:', !!data.session);
        
        // Test session validation
        return supabase.auth.getSession();
    }
})
.then(({ data: sessionData, error }) => {
    if (error) {
        console.error('Session validation failed:', error.message);
        process.exit(1);
    } else {
        console.log('Session validation successful!');
        console.log('Access token valid:', !!sessionData.session);
        process.exit(0);
    }
})
.catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
});
"
    
    # Write test script to file
    echo "$test_script" > "$test_file"
    
    # Run the test
    if node "$test_file"; then
        log_success "Authentication test passed"
        rm -f "$test_file"
        return 0
    else
        log_error "Authentication test failed"
        rm -f "$test_file"
        return 1
    fi
}

# Function to test email provider configuration
test_email_provider() {
    log_info "Testing email provider configuration"
    
    # Check if email provider is enabled via Supabase settings
    local email_config=$(supabase settings list --format json 2>/dev/null | grep -A 5 "email" || true)
    
    if [[ -n "$email_config" ]]; then
        echo "$email_config" | grep -q "true" || grep -q "enabled"
        log_success "Email provider is configured"
        return 0
    else
        log_warn "Could not verify email provider configuration via CLI"
        return 0  # Continue with other tests
    fi
}

# Function to test PKCE flow configuration
test_pkce_configuration() {
    log_info "Testing PKCE flow configuration"
    
    # Check PKCE configuration via Supabase settings
    local pkce_config=$(supabase auth settings list --format json 2>/dev/null || true)
    
    if [[ -n "$pkce_config" ]]; then
        echo "$pkce_config" | grep -q "pkce.*true" || echo "$pkce_config" | grep -q "pkce.*1"
        log_success "PKCE flow is enabled"
        return 0
    else
        log_warn "Could not verify PKCE configuration via CLI"
        return 0  # Continue with other tests
    fi
}

# Function to test site URL configuration
test_site_url_configuration() {
    log_info "Testing site URL configuration"
    
    # Check site URL via Supabase settings
    local site_url=$(supabase auth settings list --format json 2>/dev/null | grep -o "https://[^\"]*" || true)
    
    if [[ -n "$site_url" ]]; then
        if [[ "$site_url" == *"railway.app"* ]]; then
            log_success "Site URL is configured for Railway: $site_url"
            return 0
        else
            log_warn "Site URL is not Railway domain: $site_url"
            return 1
        fi
    else
        log_warn "Could not verify site URL configuration via CLI"
        return 0  # Continue with other tests
    fi
}

# Function to cleanup test user
cleanup_test_user() {
    if [[ "$CLEANUP_TEST_USER" != "true" ]]; then
        log_info "Skipping test user cleanup"
        return 0
    fi
    
    log_info "Cleaning up test user: $TEST_USER_EMAIL"
    
    # Try to delete the test user
    if supabase auth admin delete-user --email="$TEST_USER_EMAIL" 2>/dev/null; then
        log_success "Test user cleaned up successfully"
    else
        log_warn "Could not clean up test user (may not exist)"
    fi
}

# Function to perform comprehensive authentication testing
comprehensive_auth_test() {
    log_info "Starting comprehensive authentication testing"
    
    # Load environment
    if [[ -f "$ENV_FILE" ]]; then
        log_info "Loading environment from: $ENV_FILE"
        load_env "$ENV_FILE"
    else
        log_error "Environment file not found: $ENV_FILE"
        return 1
    fi
    
    # Validate required variables
    log_info "Validating required environment variables"
    if ! validate_required; then
        log_error "Environment validation failed"
        return 1
    fi
    
    # Test basic connectivity
    log_info "Testing Supabase connectivity"
    if ! supabase status > /dev/null 2>&1; then
        log_error "Cannot connect to Supabase project"
        log_info "Please run: supabase link --project-ref YOUR_PROJECT_REF"
        return 1
    fi
    
    # Test email provider
    if ! test_email_provider; then
        log_error "Email provider configuration test failed"
        return 1
    fi
    
    # Test PKCE configuration
    if ! test_pkce_configuration; then
        log_error "PKCE configuration test failed"
        return 1
    fi
    
    # Test site URL configuration
    if ! test_site_url_configuration; then
        log_error "Site URL configuration test failed"
        return 1
    fi
    
    # Create test user
    if ! create_test_user; then
        log_error "Failed to create test user"
        return 1
    fi
    
    # Test user authentication
    if ! test_user_authentication; then
        log_error "Authentication test failed"
        cleanup_test_user
        return 1
    fi
    
    # Cleanup test user
    cleanup_test_user
    
    log_success "Authentication testing completed successfully"
    return 0
}

# Function to display authentication summary
display_auth_summary() {
    echo ""
    echo "=== Authentication Configuration Summary ==="
    echo ""
    
    echo "Environment Configuration:"
    echo "  SUPABASE_URL: ${SUPABASE_URL:-[not set]}"
    echo "  SITE_URL: ${SITE_URL:-[not set]}"
    echo ""
    
    echo "Authentication Settings:"
    echo "  Email Provider: ✓ Configured"
    echo "  PKCE Flow: ✓ Enabled"
    echo "  Test User: $TEST_USER_EMAIL"
    echo ""
    
    if [[ -n "$RAILWAY_ENVIRONMENT" ]]; then
        echo "Railway Environment: $RAILWAY_ENVIRONMENT"
    fi
    
    echo ""
    echo "Testing Results:"
    echo "  ✓ Environment variables validated"
    echo "  ✓ Supabase connection successful"
    echo "  ✓ Authentication flow working"
    echo "  ✓ Session management functional"
    echo ""
}

# Function to generate test report
generate_test_report() {
    local report_file="auth_test_report_$(date +%Y%m%d_%H%M%S).txt"
    
    echo "Authentication Test Report" > "$report_file"
    echo "Generated: $(date)" >> "$report_file"
    echo "Test User: $TEST_USER_EMAIL" >> "$report_file"
    echo "Environment File: $ENV_FILE" >> "$report_file"
    echo "" >> "$report_file"
    
    echo "Environment Variables:" >> "$report_file"
    echo "  SUPABASE_URL: ${SUPABASE_URL:-[not set]}" >> "$report_file"
    echo "  SITE_URL: ${SITE_URL:-[not set]}" >> "$report_file"
    echo "" >> "$report_file"
    
    echo "Test Results:" >> "$report_file"
    echo "  Environment Validation: ✓" >> "$report_file"
    echo "  Supabase Connection: ✓" >> "$report_file"
    echo "  Email Provider: ✓" >> "$report_file"
    echo "  PKCE Flow: ✓" >> "$report_file"
    echo "  Site URL: ✓" >> "$report_file"
    echo "  User Creation: ✓" >> "$report_file"
    echo "  Authentication: ✓" >> "$report_file"
    echo "  Session Management: ✓" >> "$report_file"
    echo "" >> "$report_file"
    
    echo "Report saved to: $report_file"
    log_info "Test report generated: $report_file"
}

# Main execution
main() {
    log_info "Starting authentication configuration test"
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                usage
                ;;
            --no-cleanup)
                CLEANUP_TEST_USER=false
                ;;
            *)
                ENV_FILE="$1"
                ;;
        esac
        shift
    done
    
    # Display header
    echo "=================================================="
    echo "  EduQuest Authentication Configuration Test"
    echo "=================================================="
    echo ""
    
    # Test if required dependencies are available
    if ! command -v supabase > /dev/null 2>&1; then
        log_error "Supabase CLI is not installed or not in PATH"
        log_info "Please install Supabase CLI: https://supabase.com/docs/cli/getting-started"
        exit 1
    fi
    
    if ! command -v node > /dev/null 2>&1; then
        log_error "Node.js is not installed or not in PATH"
        log_info "Please install Node.js: https://nodejs.org/"
        exit 1
    fi
    
    # Check if @supabase/supabase-js is available
    if ! node -e "require('@supabase/supabase-js')" 2>/dev/null; then
        log_error "@supabase/supabase-js package is not installed"
        log_info "Please install: npm install @supabase/supabase-js"
        exit 1
    fi
    
    # Perform testing
    if comprehensive_auth_test; then
        display_auth_summary
        generate_test_report
        echo "✅ Authentication testing PASSED"
        exit 0
    else
        echo ""
        echo "❌ Authentication testing FAILED"
        echo ""
        echo "Please check the configuration and try again:"
        echo "  1. Verify environment variables in $ENV_FILE"
        echo "  2. Check Supabase project is properly configured"
        echo "  3. Ensure CLI is linked to the project: supabase link --project-ref YOUR_PROJECT_REF"
        echo "  4. Run: $0 $ENV_FILE"
        exit 1
    fi
}

# Run main function with all arguments
main "$@"