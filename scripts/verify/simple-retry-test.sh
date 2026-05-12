#!/bin/bash

source "$(dirname "$0")/../lib/logging.sh"
source "$(dirname "$0")/../lib/retry-utils.sh"

log_info "Testing retry utilities..."

# Test a successful command
if retry "echo 'success'" 1 1 "Test success"; then
    log_info "✓ Retry success case works"
else
    log_error "✗ Retry success case failed"
    exit 1
fi

# Test failure case
retry "exit 1" 1 1 "Test failure"
exit_code=$?
if [[ $exit_code -eq 0 ]]; then
    log_error "✗ Retry should have failed but succeeded"
    exit 1
else
    log_info "✓ Retry failure case works correctly (expected exit code: $exit_code)"
fi

log_success "All retry tests passed!"