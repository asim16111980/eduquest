#!/bin/bash

# Deployment Automation Script for EduQuest Admin Dashboard
# Purpose: Automates the deployment process to Railway with proper validation
# Usage: ./scripts/deploy.sh [--dry-run] [--force] [--environment=production|staging]

set -e  # Exit on any error

# Source shared utilities
source "$(dirname "$0")/../lib/logging.sh"
source "$(dirname "$0")/../lib/error-handling.sh"
source "$(dirname "$0")/../lib/retry-utils.sh"

# Initialize error handling
init_error_handling

# Configuration
RAILWAY_PROJECT="${RAILWAY_PROJECT:-eduquest-admin}"
RAILWAY_ENVIRONMENT="${RAILWAY_ENVIRONMENT:-production}"
DRY_RUN=false
FORCE=false
ENVIRONMENT="production"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to display usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Deployment Automation Script for EduQuest Admin Dashboard"
    echo ""
    echo "Options:"
    echo "  --dry-run           Show what would be deployed without making changes"
    echo "  --force             Skip validation checks and deploy anyway"
    echo "  --environment=ENV   Target environment (production|staging) [default: production]"
    echo "  -h, --help          Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0                          # Deploy to production with validation"
    echo "  $0 --dry-run                # Preview deployment without changes"
    echo "  $0 --environment=staging    # Deploy to staging environment"
    echo "  $0 --force                  # Deploy without validation (use with caution)"
    echo ""
    echo "This script performs the following:"
    echo "  1. Validates environment configuration"
    echo "  2. Checks Railway CLI authentication"
    echo "  3. Runs all setup scripts (if not skipped)"
    echo "  4. Validates Supabase connection"
    echo "  5. Deploys to Railway"
    echo "  6. Verifies deployment success"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --environment=*)
            ENVIRONMENT="${1#*=}"
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            ;;
    esac
done

# Function to validate environment configuration
validate_environment() {
    log_info "Validating environment configuration"
    
    # Check if .env.local exists
    if [[ ! -f ".env.local" ]]; then
        log_error "Environment file .env.local not found"
        log_info "Create .env.local from .env.local.template"
        return 1
    fi
    
    # Validate required environment variables
    if [[ -z "${SUPABASE_URL}" ]]; then
        log_error "SUPABASE_URL is not set"
        return 1
    fi
    
    if [[ -z "${SUPABASE_ANON_KEY}" ]]; then
        log_error "SUPABASE_ANON_KEY is not set"
        return 1
    fi
    
    if [[ -z "${SUPABASE_SERVICE_ROLE_KEY}" ]]; then
        log_error "SUPABASE_SERVICE_ROLE_KEY is not set"
        return 1
    fi
    
    log_success "Environment configuration is valid"
    return 0
}

# Function to check Railway CLI authentication
check_railway_auth() {
    log_info "Checking Railway CLI authentication"
    
    if ! railway auth status >/dev/null 2>&1; then
        log_error "Railway CLI is not authenticated"
        log_info "Run 'railway login' to authenticate"
        return 1
    fi
    
    local username=$(railway auth user --json | jq -r '.username' 2>/dev/null || echo "unknown")
    log_success "Railway CLI authenticated as: $username"
    return 0
}

# Function to validate Supabase connection
validate_supabase_connection() {
    log_info "Validating Supabase connection"
    
    if ! supabase status >/dev/null 2>&1; then
        log_error "Cannot connect to Supabase project"
        log_info "Run 'supabase link --project-ref YOUR_PROJECT_REF' to link your project"
        return 1
    fi
    
    local project_ref=$(supabase status --json | jq -r '.projectRef' 2>/dev/null || echo "unknown")
    log_success "Supabase project connected: $project_ref"
    return 0
}

# Function to verify Railway project configuration
verify_railway_project() {
    log_info "Verifying Railway project configuration"
    
    local current_project=$(railway context --json | jq -r '.project.name' 2>/dev/null || echo "unknown")
    
    if [[ "$current_project" != "$RAILWAY_PROJECT" ]]; then
        if [[ "$FORCE" != "true" ]]; then
            log_error "Current project '$current_project' does not match expected '$RAILWAY_PROJECT'"
            log_info "Switch to correct project: railway use $RAILWAY_PROJECT"
            return 1
        fi
    fi
    
    log_success "Railway project is configured: $current_project"
    return 0
}

# Function to run pre-deployment validation scripts
run_validation_scripts() {
    log_info "Running pre-deployment validation scripts"
    
    local scripts=(
        "./scripts/verify/verify-env.sh"
        "./scripts/verify/project-connection.sh"
        "./scripts/verify/security-verification.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [[ -f "$script" ]]; then
            log_info "Running: $script"
            if ! bash "$script"; then
                log_error "Validation failed: $script"
                return 1
            fi
        else
            log_warn "Validation script not found: $script"
        fi
    done
    
    log_success "All validation scripts passed"
    return 0
}

# Function to deploy to Railway
deploy_to_railway() {
    log_info "Deploying to Railway"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "Dry run - would execute: railway up"
        log_success "Dry run completed successfully"
        return 0
    fi
    
    # Set environment for Railway
    local railway_env="production"
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        railway_env="staging"
    fi
    
    # Deploy to Railway
    log_info "Deploying to ${railway_env} environment"
    if ! railway up; then
        log_error "Railway deployment failed"
        return 1
    fi
    
    log_success "Railway deployment completed"
    return 0
}

# Function to verify deployment
verify_deployment() {
    log_info "Verifying deployment"
    
    # Check Railway deployment status
    local deployment_url="https://${RAILWAY_PROJECT}.railway.app"
    
    log_info "Checking deployment at: $deployment_url"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "Dry run - would check: $deployment_url"
        return 0
    fi
    
    # Test if the application is responding
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" "$deployment_url" 2>/dev/null || echo "000")
    
    if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
        log_success "Deployment verified - application responding (HTTP $http_code)"
        return 0
    else
        log_warn "Application returned HTTP $http_code (expected 2xx)"
        if [[ "$FORCE" != "true" ]]; then
            log_info "Use --force to complete deployment despite verification warning"
            return 1
        fi
    fi
    
    log_success "Deployment completed (verification warning ignored)"
    return 0
}

# Function to display deployment summary
display_summary() {
    echo ""
    echo "=== Deployment Summary ==="
    echo ""
    echo "Environment: $ENVIRONMENT"
    echo "Project: $RAILWAY_PROJECT"
    echo "Railway URL: https://${RAILWAY_PROJECT}.railway.app"
    echo "Dry Run: $DRY_RUN"
    echo ""
    echo "Post-deployment steps:"
    echo "  1. Verify application functionality"
    echo "  2. Check Railway logs for any issues"
    echo "  3. Test API endpoints"
    echo "  4. Monitor uptime and performance"
    echo ""
}

# Main deployment function
main() {
    log_info "Starting deployment process"
    echo "=================================================="
    echo "  EduQuest Deployment Automation"
    echo "  Environment: $ENVIRONMENT"
    echo "  Time: $(date -Iseconds)"
    echo "=================================================="
    echo ""
    
    # Validation checks (skip with --force)
    if [[ "$FORCE" != "true" ]]; then
        if ! validate_environment; then
            log_error "Environment validation failed"
            exit 1
        fi
        
        if ! check_railway_auth; then
            log_error "Railway authentication check failed"
            exit 1
        fi
        
        if ! validate_supabase_connection; then
            log_error "Supabase connection validation failed"
            exit 1
        fi
        
        if ! verify_railway_project; then
            log_error "Railway project verification failed"
            exit 1
        fi
        
        if ! run_validation_scripts; then
            log_error "Pre-deployment validation scripts failed"
            exit 1
        fi
    else
        log_warn "Skipping validation checks (using --force)"
    fi
    
    # Deploy
    if ! deploy_to_railway; then
        log_error "Deployment failed"
        exit 1
    fi
    
    # Verify
    if ! verify_deployment; then
        if [[ "$FORCE" != "true" ]]; then
            log_error "Deployment verification failed"
            exit 1
        else
            log_warn "Continuing despite verification failure (using --force)"
        fi
    fi
    
    # Display summary
    display_summary
    
    log_success "Deployment completed successfully!"
    echo "=================================================="
}

# Run main function
main
