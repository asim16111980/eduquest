#!/bin/bash

# Logging infrastructure for setup operations
# Usage: source logging.sh

# Log levels
LOG_LEVEL=${LOG_LEVEL:-INFO}  # DEBUG, INFO, WARN, ERROR
LOG_FILE=${LOG_FILE:-/tmp/eduquest-setup.log}
TIMESTAMP_FORMAT="%Y-%m-%d %H:%M:%S"

# Colors for terminal output
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
COLOR_GREEN='\033[0;32m'
COLOR_BLUE='\033[0;34m'
COLOR_NC='\033[0m' # No Color

# Initialize log file
init_logging() {
    mkdir -p "$(dirname "$LOG_FILE")"
    # Only write header if file doesn't exist or is empty
    if [[ ! -s "$LOG_FILE" ]]; then
        echo "=== EduQuest Setup Log - $(date) ===" > "$LOG_FILE"
    fi
}

# Logging functions with level filtering
log_with_level() {
    local level="$1"
    local color="$2"
    local message="$3"
    local timestamp=$(date +"$TIMESTAMP_FORMAT")

    # Map severity levels to numeric ranks
    local -A level_ranks
    level_ranks["DEBUG"]=0
    level_ranks["INFO"]=1
    level_ranks["WARN"]=2
    level_ranks["ERROR"]=3

    # Get message rank and configured rank
    local message_rank=${level_ranks["$level"]}
    local configured_rank=${level_ranks["$LOG_LEVEL"]}

    # Default to INFO level if not configured
    if [[ -z "$configured_rank" ]]; then
        configured_rank=1
    fi

    # Check if this level should be logged
    if [[ $message_rank -lt $configured_rank ]]; then
        return
    fi

    # Log to file
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"

    # Log to terminal with color
    echo -e "${color}[${timestamp}] [$level] ${message}${COLOR_NC}" >&2
}

# Public logging functions
log_debug() {
    log_with_level "DEBUG" "$COLOR_BLUE" "$1"
}

log_info() {
    log_with_level "INFO" "$COLOR_GREEN" "$1"
}

log_warn() {
    log_with_level "WARN" "$COLOR_YELLOW" "$1"
}

log_error() {
    log_with_level "ERROR" "$COLOR_RED" "$1"
}

# Specialized logging functions
log_step() {
    log_info "=== STEP: $1 ==="
}

log_success() {
    log_info "✓ SUCCESS: $1"
}

log_failure() {
    log_error "✗ FAILED: $1"
}

# Initialize logging when sourced
init_logging