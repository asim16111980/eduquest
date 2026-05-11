#!/bin/bash

# Supabase CLI authentication and project linking framework
# Usage: source cli-auth-framework.sh

source "$(dirname "$0")/../lib/logging.sh"
source "$(dirname "$0")/../lib/retry-utils.sh"
source "$(dirname "$0")/../lib/env-validation.sh"

# Configuration
PROJECT_REF_FILE=".supabase_project_ref"
PROJECT_LINKED_FLAG=".project_linked"

# Check if CLI is installed
check_cli_installed() {
    log_info "Checking Supabase CLI installation..."

    if ! command -v supabase &> /dev/null; then
        log_error "Supabase CLI not found"
        log_info "Please install from: https://supabase.com/docs/guides/cli/getting-started"
        return 1
    fi

    if ! version=$(supabase --version); then
        log_error "Failed to get Supabase CLI version"
        return 1
    fi

    log_info "Supabase CLI found: $version"
    return 0
}

# Check if already authenticated
check_authenticated() {
    log_info "Checking authentication status..."

    if supabase auth status &> /dev/null; then
        log_success "Already authenticated to Supabase"
        return 0
    else
        log_warn "Not authenticated to Supabase"
        return 1
    fi
}

# Handle authentication
handle_authentication() {
    local email="$1"
    local password="$2"

    log_step "Supabase Authentication"

    if check_authenticated; then
        log_success "Already authenticated"
        return 0
    fi

    log_info "Authentication required"

    # If email provided, attempt login
    if [[ -n "$email" ]]; then
        log_info "Attempting login with email..."
        SUPABASE_PASSWORD="$password" retry_supabase_command "supabase auth login --email $email --password-stdin" \
                              "Email login" \
                              3
        return $?
    else
        log_info "Please authenticate manually:"
        log_info "1. Run: supabase auth login"
        log_info "2. Follow the prompts to authenticate"
        log_info ""
        log_info "Or provide email and password as arguments:"
        log_info "  $0 --auth-email your@email.com --auth-password yourpass"
        return 1
    fi
}

# Link project
link_project() {
    local project_ref="$1"

    log_step "Linking Supabase Project"

    if [[ -z "$project_ref" ]]; then
        log_error "Project reference required"
        return 1
    fi

    # Check if already linked
    if [[ -f "$PROJECT_LINKED_FLAG" ]]; then
        log_info "Project already linked"
        return 0
    fi

    # Load environment
    if [[ -f ".env.local" ]]; then
        load_env ".env.local"
    fi

    # Validate environment
    if ! validate_required; then
        log_error "Environment validation failed"
        return 1
    fi

    # Link project
    log_info "Linking project: $project_ref"
    if retry_supabase_command "supabase link --project-ref $project_ref" \
                             "Project link" \
                             3; then
        # Save project ref
        echo "$project_ref" > "$PROJECT_REF_FILE"
        touch "$PROJECT_LINKED_FLAG"
        log_success "Project linked successfully"
        return 0
    else
        log_error "Failed to link project"
        return 1
    fi
}

# Verify project setup
verify_project_setup() {
    local project_ref="$1"

    log_step "Verifying Project Setup"

    # Check CLI installation
    if ! check_cli_installed; then
        return 1
    fi

    # Check authentication
    if ! check_authenticated; then
        return 1
    fi

    # Check project link
    if [[ -f "$PROJECT_LINKED_FLAG" ]]; then
        log_info "Project already linked and verified"
        return 0
    fi

    # Link project if ref provided
    if [[ -n "$project_ref" ]]; then
        link_project "$project_ref"
        return $?
    else
        log_error "Project reference required for verification"
        return 1
    fi
}

# Get project information
get_project_info() {
    local project_ref="$1"

    if [[ -z "$project_ref" ]]; then
        log_error "Project reference required"
        return 1
    fi

    log_info "Fetching project information..."

    retry_supabase_command "supabase projects list --format json | jq -r --arg project_ref \"$project_ref\" '.[] | select(.ref == \$project_ref) | \"\(.name)\t\(.region)\t\(.status)\"'" \
                          "Get project info" \
                          3 || return 1
}

# Setup complete marker
mark_setup_complete() {
    local phase="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    echo "$timestamp - $phase setup complete" >> ".setup_complete"
    log_success "Phase $phase setup marked as complete"
}

# Check if setup is complete
is_setup_complete() {
    local phase="$1"

    if [[ -f ".setup_complete" ]]; then
        if grep -q "$phase setup complete" ".setup_complete"; then
            return 0
        fi
    fi
    return 1
}

# Main execution
case "${1:-help}" in
    "check-cli")
        check_cli_installed
        ;;
    "check-auth")
        check_authenticated
        ;;
    "auth")
        handle_authentication "$2" "$3"
        ;;
    "link")
        link_project "$2"
        ;;
    "verify")
        verify_project_setup "$2"
        ;;
    "info")
        get_project_info "$2"
        ;;
    "complete")
        mark_setup_complete "$2"
        ;;
    "is-complete")
        is_setup_complete "$2"
        ;;
    "help")
        echo "Usage: $0 {check-cli|check-auth|auth|link|verify|info|complete|is-complete} [args]"
        echo "  check-cli     - Check if CLI is installed"
        echo "  check-auth    - Check authentication status"
        echo "  auth [email] [password] - Handle authentication"
        echo "  link <ref>    - Link to project"
        echo "  verify <ref>  - Verify complete setup"
        echo "  info <ref>    - Get project information"
        echo "  complete <phase> - Mark phase as complete"
        echo "  is-complete <phase> - Check if phase is complete"
        ;;
    *)
        echo "Unknown command: $1"
        exit 1
        ;;
esac