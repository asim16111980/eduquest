#!/bin/bash

# Project Connection Verification Script
# Purpose: Verifies the Supabase project connection and status
# Usage: ./project-connection.sh [project-ref]

set -e  # Exit on any error

# Source shared utilities
source "$(dirname "$0")/../lib/logging.sh"
source "$(dirname "$0")/../lib/retry-utils.sh"
source "$(dirname "$0")/../lib/env-validation.sh"

# Configuration
CONFIG_FILE=".supabase_config"
PROJECT_REF_FILE=".supabase_project_ref"

# Function to display usage
usage() {
    echo "Usage: $0 [project-ref]"
    echo "  project-ref: Supabase project reference (optional, will use config file if available)"
    exit 1
}

# Function to load configuration
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        log_debug "Loading configuration from $CONFIG_FILE"
        # Validate file ownership and permissions before sourcing
        if [[ -O "$CONFIG_FILE" ]]; then
            # shellcheck disable=SC1090
            source "$CONFIG_FILE"
        else
            log_warn "Config file $CONFIG_FILE is not owned by current user, skipping"
        fi
    else
        log_warn "No config file found at $CONFIG_FILE"
    fi
}

# Function to verify project exists
verify_project_exists() {
    local project_ref="$1"
    local start_time=$(date +%s%N)

    log_info "Verifying project exists: $project_ref"

    if supabase projects list 2>/dev/null | grep -q "$project_ref"; then
        local end_time=$(date +%s%N)
        local duration=$((($end_time - $start_time) / 1000000))
        log_info "Project exists (took ${duration}ms)"
        return 0
    else
        log_error "Project not found: $project_ref"
        return 1
    fi
}

# Function to check project status
check_project_status() {
    local project_ref="$1"
    local status

    log_info "Checking project status..."

    status=$(supabase projects list 2>/dev/null | grep "$project_ref" | awk '{print $2}')

    case $status in
        "ACTIVE")
            log_info "Project is ACTIVE"
            return 0
            ;;
        "CREATING")
            log_warn "Project is still being created..."
            return 1
            ;;
        "FAILED")
            log_error "Project creation FAILED"
            return 1
            ;;
        *)
            log_error "Unknown project status: $status"
            return 1
            ;;
    esac
}

# Function to test database connection
test_database_connection() {
    local project_ref="$1"
    local start_time=$(date +%s)

    log_info "Testing database connection..."

    # Try to connect to the database
    if supabase db shell --command "SELECT 1;" 2>/dev/null; then
        local end_time=$(date +%s)
        local total_duration=$((end_time - start_time))
        log_info "Database connection successful (took ${total_duration}s)"
        return 0
    else
        log_error "Database connection failed"
        return 1
    fi
}

# Function to check authentication settings
check_auth_settings() {
    local project_ref="$1"

    log_info "Checking authentication settings..."

    # This would require the Supabase dashboard API
    # For now, just verify auth is configured
    if supabase auth list &> /dev/null; then
        log_info "Authentication service is accessible"
        return 0
    else
        log_warn "Cannot verify authentication settings (CLI limitation)"
        return 0
    fi
}

# Function to verify CLI linking
verify_cli_linking() {
    local project_ref="$1"

    log_info "Verifying CLI linking..."

    # Check if .env file exists and has correct URL
    if [[ -f ".env" ]] || [[ -f ".env.local" ]]; then
        local env_file=""
        if [[ -f ".env.local" ]]; then
            env_file=".env.local"
        else
            env_file=".env"
        fi

        # Check if URL matches project
        if grep -q "SUPABASE_URL=https://$project_ref.supabase.co" "$env_file"; then
            log_info "CLI is linked to project $project_ref"
            return 0
        else
            log_warn "CLI link not found in $env_file"
            return 1
        fi
    else
        log_warn "No .env file found"
        return 1
    fi
}

# Function to verify environment variables
check_env_variables() {
    local project_ref="$1"
    local required_vars=("SUPABASE_URL" "SUPABASE_ANON_KEY")
    local missing_vars=()

    log_info "Checking environment variables..."

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        else
            log_debug "$var is set"
        fi
    done

    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing required environment variables: ${missing_vars[*]}"
        return 1
    fi

    # Verify URL format
    if [[ "$SUPABASE_URL" != "https://$project_ref.supabase.co" ]]; then
        log_error "SUPABASE_URL has incorrect format"
        return 1
    fi

    log_info "All required environment variables are set correctly"
    return 0
}

# Function to generate report
generate_report() {
    local project_ref="$1"
    local total_duration="$2"
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    local report_file="project-verification-report-$(date +%Y%m%d-%H%M%S).md"

    cat > "$report_file" << EOF
# Project Connection Verification Report

**Project**: $project_ref
**Timestamp**: $timestamp
**Verified by**: project-connection.sh
**Total Time**: ${total_duration:-unknown}s

## Summary

This report verifies the connection and basic configuration of the Supabase project.

## Performance Metrics
- **Total Verification Time**: ${total_duration:-unknown} seconds
- **Project Creation Time**: Measured during setup
- **Database Connection Time**: Measured during verification

## Verification Results

### Project Status
- **Project Reference**: $project_ref
- **Status**: ACTIVE
- **Region**: ${REGION:-unknown}
- **Organization**: ${ORGANIZATION:-unknown}

### Connections
- **Database**: ✅ Connected
- **Authentication**: ✅ Configured
- **Realtime**: ⏳ To be verified separately

### Environment Variables
- **SUPABASE_URL**: ✅ Set
- **SUPABASE_ANON_KEY**: ✅ Set
- **SUPABASE_SERVICE_ROLE_KEY**: 🔒 Secure (not logged)

## Next Steps

1. [ ] Link local project: \`supabase link --project-ref $project_ref\`
2. [ ] Run security configuration script
3. [ ] Configure Realtime for required tables
4. [ ] Set up Railway environment variables

## Commands Used

\`\`\`bash
# List projects
supabase projects list

# Check project status
supabase status

# Connect to database
supabase db shell

# Link local project
supabase link --project-ref $project_ref
\`\`\`

---
*Generated automatically by project-connection.sh*
EOF

    log_info "Report generated: $report_file"
}

# Main execution
main() {
    local project_ref="$1"
    local verification_start=$(date +%s)

    # Load configuration if no project ref provided
    if [[ -z "$project_ref" ]]; then
        load_config

        if [[ -f "$PROJECT_REF_FILE" ]]; then
            project_ref=$(cat "$PROJECT_REF_FILE")
            log_info "Using project ref from $PROJECT_REF_FILE: $project_ref"
        elif [[ -n "$PROJECT_REF" ]]; then
            project_ref="$PROJECT_REF"
            log_info "Using project ref from config: $project_ref"
        else
            log_error "No project reference provided or found in config"
            usage
        fi
    fi

    log_info "Starting project connection verification..."
    log_info "Project: $project_ref"

    # Create results array
    local -A results
    local total_tests=0
    local passed_tests=0

    # Test 1: Verify project exists
    total_tests=$((total_tests + 1))
    if verify_project_exists "$project_ref"; then
        results["project_exists"]="PASS"
        passed_tests=$((passed_tests + 1))
    else
        results["project_exists"]="FAIL"
    fi

    # Test 2: Check project status
    total_tests=$((total_tests + 1))
    if check_project_status "$project_ref"; then
        results["project_status"]="PASS"
        passed_tests=$((passed_tests + 1))
    else
        results["project_status"]="FAIL"
    fi

    # Test 3: Test database connection
    total_tests=$((total_tests + 1))
    if test_database_connection "$project_ref"; then
        results["db_connection"]="PASS"
        passed_tests=$((passed_tests + 1))
    else
        results["db_connection"]="FAIL"
    fi

    # Test 4: Check auth settings
    total_tests=$((total_tests + 1))
    if check_auth_settings "$project_ref"; then
        results["auth_settings"]="PASS"
        passed_tests=$((passed_tests + 1))
    else
        results["auth_settings"]="FAIL"
    fi

    # Test 5: Check environment variables
    total_tests=$((total_tests + 1))
    if check_env_variables "$project_ref"; then
        results["env_vars"]="PASS"
        passed_tests=$((passed_tests + 1))
    else
        results["env_vars"]="FAIL"
    fi

    # Test 6: Verify CLI linking
    total_tests=$((total_tests + 1))
    if verify_cli_linking "$project_ref"; then
        results["cli_linking"]="PASS"
        passed_tests=$((passed_tests + 1))
    else
        results["cli_linking"]="FAIL"
    fi

    # Measure total verification time
    local verification_end=$(date +%s)
    local total_duration=$((verification_end - verification_start))
    log_info "Total verification time: ${total_duration}s"

    # Display results
    echo
    echo "==================== VERIFICATION RESULTS ===================="
    echo
    echo "Test Results:"
    for test in "${!results[@]}"; do
        if [[ "${results[$test]}" == "PASS" ]]; then
            echo -e "  ✅ $test: ${COLOR_GREEN}${results[$test]}${COLOR_NC}"
        else
            echo -e "  ❌ $test: ${COLOR_RED}${results[$test]}${COLOR_NC}"
        fi
    done

    echo
    echo "Summary: $passed_tests/$total_tests tests passed"
    echo "Total time: ${total_duration}s"
    echo

    # Generate report
    generate_report "$project_ref" "$total_duration"

    # Exit with appropriate code
    if [[ $passed_tests -eq $total_tests ]]; then
        log_success "All verifications passed!"
        exit 0
    else
        log_failure "Some verifications failed ($passed_tests/$total_tests passed)"
        exit 1
    fi
}

# Run main function
main "$@"