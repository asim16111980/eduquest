#!/bin/bash

# Retry utility functions for transient failures
# Usage: retry "command" "max_attempts" "delay" "description"

# Note: This script expects logging.sh to be sourced first for logging functions
MAX_RETRIES=${MAX_RETRIES:-3}
BASE_DELAY=${BASE_DELAY:-2}
BACKOFF_FACTOR=${BACKOFF_FACTOR:-2}

retry() {
    local command="$1"
    local max_attempts="${2:-$MAX_RETRIES}"
    local initial_delay="${3:-$BASE_DELAY}"
    local description="$4"
    local attempt=1
    local delay=$initial_delay

    if [[ -z "$description" ]]; then
        description="Command: $command"
    fi

    log_info "Starting: $description"
    log_debug "Command: $command"
    log_debug "Max attempts: $max_attempts, Initial delay: ${initial_delay}s"

    while [[ $attempt -le $max_attempts ]]; do
        if eval "$command"; then
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
    local command="$1"
    local description="$2"
    local max_attempts="${3:-$MAX_RETRIES}"

    # Special handling for Supabase operations that often need time
    retry "$command" "$max_attempts" "$BASE_DELAY" "$description"
}

# Wait for service to be ready
wait_for_service() {
    local service_name="$1"
    local check_command="$2"
    local timeout="${3:-300}"  # 5 minutes default
    local interval="${4:-10}"  # 10 seconds default

    log_info "Waiting for $service_name to be ready..."
    local elapsed=0

    while [[ $elapsed -lt $timeout ]]; do
        if eval "$check_command"; then
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