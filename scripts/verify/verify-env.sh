#!/bin/bash

# Environment Variable Verification Script
# Purpose: Validates environment variables and prevents secrets from being committed to version control
# Usage: ./verify-env.sh [env-file]

set -e  # Exit on any error

# Source shared utilities
source "$(dirname "$0")/../lib/logging.sh"
source "$(dirname "$0")/../lib/retry-utils.sh"
source "$(dirname "$0")/../lib/env-validation.sh"

# Configuration
ENV_FILE="${1:-.env.local}"
GITIGNORE_FILE=".gitignore"
TEMPLATE_FILE=".env.local.template"

# Function to display usage
usage() {
    echo "Usage: $0 [env-file]"
    echo ""
    echo "Environment Variable Verification Script"
    echo ""
    echo "Arguments:"
    echo "  env-file     Environment file to verify (default: .env.local)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Verify .env.local"
    echo "  $0 .env.production   # Verify production environment file"
    echo ""
    echo "This script performs the following checks:"
    echo "  1. Validates required environment variables are present and properly formatted"
    echo "  2. Verifies Railway domain configuration for production"
    echo "  3. Checks gitignore prevents secrets from being committed"
    echo "  4. Validates no sensitive data is accidentally staged in git"
    exit 1
}

# Function to validate gitignore configuration
validate_gitignore_secrets() {
    log_info "Checking gitignore configuration for secrets protection"
    
    # Check if gitignore exists
    if [[ ! -f "$GITIGNORE_FILE" ]]; then
        log_error "No .gitignore file found"
        return 1
    fi
    
    # Check for required patterns
    local missing_patterns=()
    
    # Check for .env patterns
    if ! grep -q "^\\.env" "$GITIGNORE_FILE" 2>/dev/null; then
        missing_patterns+=("*.env")
    fi
    
    if ! grep -q "\\.env\\.local" "$GITIGNORE_FILE" 2>/dev/null; then
        missing_patterns+=(".env.local")
    fi
    
    if ! grep -q "^\\.env\\.template" "$GITIGNORE_FILE" 2>/dev/null; then
        missing_patterns+=(".env.template")
    fi
    
    # Check for sensitive files
    if ! grep -q "\\.supabase" "$GITIGNORE_FILE" 2>/dev/null; then
        missing_patterns+=(".supabase/*")
    fi
    
    if ! grep -q "\\.railway" "$GITIGNORE_FILE" 2>/dev/null; then
        missing_patterns+=(".railway/*")
    fi
    
    if [[ ${#missing_patterns[@]} -gt 0 ]]; then
        log_error "Missing gitignore patterns for secrets protection:"
        for pattern in "${missing_patterns[@]}"; do
            log_error "  - $pattern"
        done
        log_info "Add these patterns to $GITIGNORE_FILE:"
        for pattern in "${missing_patterns[@]}"; do
            log_info "  $pattern"
        done
        return 1
    fi
    
    log_success "Gitignore properly configured for secrets protection"
    return 0
}

# Function to check git status for staged secrets
check_git_staged_secrets() {
    log_info "Checking git status for staged sensitive files"
    
    # Initialize git repo if not already
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_warn "Not a git repository, skipping git status check"
        return 0
    fi
    
    # Check for staged environment files
    local staged_files=$(git diff --cached --name-only | grep -E '\.(env|local|template)$' || true)
    
    if [[ -n "$staged_files" ]]; then
        log_error "Sensitive environment files are staged for commit:"
        echo "$staged_files" | while read -r file; do
            log_error "  - $file"
        done
        log_error "WARNING: These files may contain secrets!"
        log_info "Unstage these files:"
        echo "$staged_files" | while read -r file; do
            log_info "  git reset --cached $file"
        done
        return 1
    fi
    
    # Check for untracked .env.local (good - should be untracked)
    if [[ -f ".env.local" ]] && [[ -z "$(git status --porcelain .env.local 2>/dev/null | grep '^??')" ]]; then
        # File exists but is tracked - this is bad
        log_error ".env.local is tracked by git - this may expose secrets!"
        log_info "Remove it from git tracking:"
        log_info "  git rm --cached .env.local"
        return 1
    fi
    
    log_success "No sensitive files are staged for commit"
    return 0
}

# Function to validate Railway production configuration
validate_railway_production() {
    log_info "Validating Railway production configuration"
    
    # Check if we're in Railway environment
    if [[ -n "$RAILWAY_ENVIRONMENT" || -n "$RAILWAY_SERVICE_NAME" ]]; then
        log_info "Detected Railway deployment environment"
        
        # Validate Railway domain
        if ! validate_railway_domain; then
            log_error "Railway domain validation failed"
            return 1
        fi
        
        # Check for Railway-specific variables
        local railway_vars=("SUPABASE_URL" "SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY")
        local missing_railway=()
        
        for var in "${railway_vars[@]}"; do
            if [[ -z "${!var}" ]]; then
                missing_railway+=("$var")
            fi
        done
        
        if [[ ${#missing_railway[@]} -gt 0 ]]; then
            log_error "Missing Railway environment variables:"
            for var in "${missing_railway[@]}"; do
                log_error "  - $var"
            done
            return 1
        fi
        
        log_success "Railway production configuration is valid"
    else
        log_info "Not in Railway environment - skipping Railway-specific checks"
    fi
    
    return 0
}

# Function to perform comprehensive environment validation
comprehensive_validation() {
    log_info "Starting comprehensive environment validation"
    
    # Load environment file if it exists
    if [[ -f "$ENV_FILE" ]]; then
        log_info "Loading environment from: $ENV_FILE"
        load_env "$ENV_FILE"
    else
        log_warn "Environment file not found: $ENV_FILE"
        log_info "Creating from template..."
        if [[ -f "$TEMPLATE_FILE" ]]; then
            cp "$TEMPLATE_FILE" "$ENV_FILE"
            log_info "Created $ENV_FILE from template"
            log_info "Please edit $ENV_FILE with your actual values before continuing"
        else
            log_error "Template file not found: $TEMPLATE_FILE"
            return 1
        fi
    fi
    
    # Validate required variables
    log_info "Validating required environment variables"
    if ! validate_required; then
        log_error "Environment validation failed - missing or invalid required variables"
        return 1
    fi
    
    # Validate Railway configuration
    if ! validate_railway_production; then
        log_error "Railway production validation failed"
        return 1
    fi
    
    # Validate gitignore
    if ! validate_gitignore_secrets; then
        log_error "Gitignore validation failed"
        return 1
    fi
    
    # Check git status
    if ! check_git_staged_secrets; then
        log_error "Git status check failed - sensitive files may be committed"
        return 1
    fi
    
    log_success "Environment validation completed successfully"
    return 0
}

# Function to display environment summary
display_environment_summary() {
    echo ""
    echo "=== Environment Configuration Summary ==="
    echo ""
    
    # Display key variables (masked for security)
    echo "Environment Variables:"
    echo "  SUPABASE_URL: ${SUPABASE_URL:-[not set]}"
    echo "  SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:0:20}...${SUPABASE_ANON_KEY: -20}"
    echo "  SUPABASE_SERVICE_ROLE_KEY: [REDACTED - Server Only]"
    echo ""
    
    if [[ -n "$SITE_URL" ]]; then
        echo "Site URL: $SITE_URL"
    fi
    
    if [[ -n "$RAILWAY_ENVIRONMENT" ]]; then
        echo "Railway Environment: $RAILWAY_ENVIRONMENT"
    fi
    
    echo ""
    echo "Security Status:"
    if [[ -f "$GITIGNORE_FILE" ]]; then
        echo "  ✓ Gitignore configured for secrets protection"
    else
        echo "  ✗ No gitignore file found"
    fi
    
    if git rev-parse --git-dir > /dev/null 2>&1; then
        if [[ -z "$(git diff --cached --name-only | grep -E '\.(env|local|template)$')" ]]; then
            echo "  ✓ No sensitive files staged for commit"
        else
            echo "  ✗ Sensitive files staged for commit"
        fi
    else
        echo "  ⚠ Not a git repository"
    fi
    
    echo ""
}

# Main execution
main() {
    log_info "Starting environment verification"
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                usage
                ;;
            *)
                ENV_FILE="$1"
                ;;
        esac
        shift
    done
    
    # Display header
    echo "=================================================="
    echo "  EduQuest Environment Variable Verification"
    echo "=================================================="
    echo ""
    
    # Perform validation
    if comprehensive_validation; then
        display_environment_summary
        echo "✅ Environment verification PASSED"
        exit 0
    else
        echo ""
        echo "❌ Environment verification FAILED"
        echo ""
        echo "Please fix the issues above and run again:"
        echo "  $0 $ENV_FILE"
        exit 1
    fi
}

# Run main function with all arguments
main "$@"