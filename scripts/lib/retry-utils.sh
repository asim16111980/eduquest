#!/bin/bash

# Retry utility functions for transient failures
# Usage: retry "command" "max_attempts" "delay" "description"

# Note: This script expects logging.sh to be sourced first for logging functions
MAX_RETRIES=${MAX_RETRIES:-3}
BASE_DELAY=${BASE_DELAY:-2}
BACKOFF_FACTOR=${BACKOFF_FACTOR:-2}

retry() {
    local max_attempts="${1:-$MAX_RETRIES}"
    local initial_delay="${2:-$BASE_DELAY}"
    local description="${3:-Command}"
    shift 3
    local attempt=1
    local delay=$initial_delay

    log_info "Starting: $description"
    log_debug "Max attempts: $max_attempts, Initial delay: ${initial_delay}s"

    while [[ $attempt -le $max_attempts ]]; do
        if "$@"; then
            log_info "Success: $description (attempt $attempt/$max_attempts)"
            return 0
        else
            local exit_code=$?
            log_error "Failed: $description (attempt $attempt/$max_attempts, exit code: $exit_code)"

            if [[ $attempt -eq $max_attempts ]]; then
                log_error "Max attempts reached for: $description"
                return $exit_code
            fi

            log_debug "Waiting ${delay}s before retry..."
            sleep $delay
            delay=$((delay * BACKOFF_FACTOR))
            attempt=$((attempt + 1))
        fi
    done

    log_error "Should not reach here: $description"
    return 1
}

# Supabase-specific retry wrapper
retry_supabase_command() {
    local description="$1"
    local max_attempts="${2:-$MAX_RETRIES}"
    shift 2

    retry "$max_attempts" "$BASE_DELAY" "$description" "$@"
}

# Wait for service to be ready
wait_for_service() {
    local service_name="$1"
    local timeout="${2:-300}"  # 5 minutes default
    local interval="${3:-10}"  # 10 seconds default
    shift 3

    log_info "Waiting for $service_name to be ready..."
    local elapsed=0

    while [[ $elapsed -lt $timeout ]]; do
        if "$@"; then
            log_info "$service_name is ready!"
            return 0
        fi

        sleep $interval
        elapsed=$((elapsed + interval))
        log_debug "Waiting for $service_name... ($elapsed/${timeout}s)"
    done

    log_error "$service_name did not become ready within $timeout seconds"
    return 1
}

# Wait for Supabase project creation to complete
wait_for_project_creation() {
    local project_name="$1"
    local timeout="${2:-300}"  # 5 minutes default
    local interval="${3:-10}"  # 10 seconds default

    log_info "Waiting for project '$project_name' to be ready..."
    local elapsed=0

    while [[ $elapsed -lt $timeout ]]; do
        # Check if project exists and is ACTIVE
        local status=$(supabase projects list 2>/dev/null | grep "$project_name" | awk '{print $2}')

        if [[ "$status" == "ACTIVE" ]]; then
            log_info "Project '$project_name' is ACTIVE!"
            return 0
        elif [[ "$status" == "FAILED" ]]; then
            log_error "Project creation FAILED"
            return 1
        elif [[ "$status" == "CREATING" ]]; then
            log_debug "Project is still being created... ($elapsed/${timeout}s)"
        fi

        sleep $interval
        elapsed=$((elapsed + interval))
    done

    log_error "Project did not become ready within $timeout seconds"
    return 1
}