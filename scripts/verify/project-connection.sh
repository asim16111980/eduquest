#!/bin/bash

# Project connection verification utilities
# Usage: ./project-connection.sh [command]

source "$(dirname "$0")/../lib/logging.sh"
source "$(dirname "$0")/../lib/retry-utils.sh"
source "$(dirname "$0")/../lib/env-validation.sh"

# Check if CLI is authenticated
check_cli_authenticated() {
    log_info "Checking Supabase CLI authentication..."

    if ! command -v supabase &> /dev/null; then
        log_error "Supabase CLI not found. Please install it first."
        return 1
    fi

    if supabase auth status &> /dev/null; then
        log_success "Supabase CLI is authenticated"
        return 0
    else
        log_error "Supabase CLI is not authenticated. Please run 'supabase login'"
        return 1
    fi
}

# Check project link status
check_project_linked() {
    local project_ref="$1"

    if [[ -z "$project_ref" ]]; then
        log_error "Project reference not provided"
        return 1
    fi

    log_info "Checking project link for ref: $project_ref"

    # Get exact project ref from list
    local project_list
    if ! project_list=$(supabase projects list --format json 2>&1); then
        log_error "Failed to get project list: $project_list"
        return 1
    fi

    if echo "$project_list" | jq -e --arg ref "$project_ref" '.[] | select(.ref == $ref)' > /dev/null; then
        log_success "Project $project_ref is linked"
        return 0
    else
        log_error "Project $project_ref is not linked"
        return 1
    fi
}

# Verify project connection
verify_project_connection() {
    local project_ref="$1"
    local max_attempts="${2:-3}"

    log_step "Verifying project connection"

    # Check CLI authentication
    if ! retry_supabase_command "check_cli_authenticated" "CLI authentication" "$max_attempts"; then
        return 1
    fi

    # Check project link
    if ! retry_supabase_command "check_project_linked '$project_ref'" "Project link" "$max_attempts"; then
        return 1
    fi

    # Test database connection
    log_info "Testing database connection..."
    if retry_supabase_command "supabase db status" "Database connection" "$max_attempts"; then
        log_success "Project connection verified"
        return 0
    else
        log_error "Database connection failed"
        return 1
    fi
}

# Get project details
get_project_details() {
    local project_ref="$1"

    log_info "Fetching project details for: $project_ref"

    # Cache the JSON output to avoid multiple calls
    local project_list
    if ! project_list=$(supabase projects list --format json 2>&1); then
        log_error "Failed to get project list: $project_list"
        return 1
    fi

    if echo "$project_list" | jq -e --arg project_ref "$project_ref" '.[] | select(.ref == $project_ref)' > /dev/null; then
        echo "$project_list" | \
            jq --arg project_ref "$project_ref" '.[] | select(.ref == $project_ref) | {name, region, status, plan, created_at}'
    else
        log_error "Project $project_ref not found"
        return 1
    fi
}

# Main execution
case "${1:-verify}" in
    "check-auth")
        check_cli_authenticated
        ;;
    "check-link")
        check_project_linked "$2"
        ;;
    "verify")
        verify_project_connection "$2"
        ;;
    "details")
        get_project_details "$2"
        ;;
    *)
        echo "Usage: $0 {check-auth|check-link|verify|details} [project-ref]"
        echo "  check-auth - Check CLI authentication status"
        echo "  check-link <ref> - Check if project is linked"
        echo "  verify <ref> - Verify complete project connection"
        echo "  details <ref> - Get project details"
        exit 1
        ;;
esac