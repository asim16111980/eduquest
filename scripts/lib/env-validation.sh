#!/bin/bash

# Environment variable validation system
# Usage: source env-validation.sh

# Required environment variables
REQUIRED_VARS=(
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
)

# Optional environment variables with defaults
OPTIONAL_VARS=(
    "LOG_LEVEL=INFO"
    "DEBUG=false"
    "MAX_RETRIES=3"
    "BASE_DELAY=2"
)

# Validation patterns
URL_PATTERN='^https://[a-z0-9-]+\.supabase\.co$'
ANON_KEY_PATTERN='^eyJ[0-9a-zA-Z_-]*\.[0-9a-zA-Z_-]*\.[0-9a-zA-Z_-]*$'
SERVICE_KEY_PATTERN='^eyJ[0-9a-zA-Z_-]*\.[0-9a-zA-Z_-]*\.[0-9a-zA-Z_-]*$'

# Load environment from file
load_env() {
    local env_file="$1"

    if [[ -f "$env_file" ]]; then
        log_info "Loading environment from: $env_file"

        # Load file
        while IFS= read -r line || [[ -n "$line" ]]; do
            # Skip comments and empty lines
            [[ "$line" =~ ^\s*# ]] && continue
            [[ -z "$line" ]] && continue

            # Split line into key and value
            key=${line%%=*}
            value=${line#*=}

            # Validate key format (only uppercase letters, numbers, and underscores)
            if [[ ! "$key" =~ ^[A-Z_][A-Z0-9_]*$ ]]; then
                log_error "Invalid environment variable name: $key"
                continue
            fi

            # Check for suspicious characters in value
            if [[ "$value" =~ [\`] || "$value" =~ \\\\$ ]]; then
                log_error "Suspicious characters in environment variable: $key"
                continue
            fi

            # Export safely
            export "${key}=${value}"
        done < "$env_file"

        log_debug "Loaded environment variables from $env_file"
    else
        log_warn "Environment file not found: $env_file"
    fi
}

# Validate environment variable format
validate_var() {
    local var_name="$1"
    local var_value="$2"
    local pattern="$3"

    if [[ -z "$var_value" ]]; then
        log_error "Environment variable $var_name is empty"
        return 1
    fi

    if [[ -n "$pattern" && ! "$var_value" =~ $pattern ]]; then
        log_error "Environment variable for $var_name has invalid format"
        return 1
    fi

    return 0
}

# Validate all required variables
validate_required() {
    local missing_vars=()
    local invalid_vars=()

    for var in "${REQUIRED_VARS[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        else
            # Validate specific patterns
            case "$var" in
                "SUPABASE_URL")
                    if ! validate_var "$var" "${!var}" "$URL_PATTERN"; then
                        invalid_vars+=("$var")
                    fi
                    ;;
                "SUPABASE_ANON_KEY")
                    if ! validate_var "$var" "${!var}" "$ANON_KEY_PATTERN"; then
                        invalid_vars+=("$var")
                    fi
                    ;;
                "SUPABASE_SERVICE_ROLE_KEY")
                    if ! validate_var "$var" "${!var}" "$SERVICE_KEY_PATTERN"; then
                        invalid_vars+=("$var")
                    fi
                    ;;
            esac
        fi
    done

    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            log_error "  - $var"
        done
    fi

    if [[ ${#invalid_vars[@]} -gt 0 ]]; then
        log_error "Invalid environment variables:"
        for var in "${invalid_vars[@]}"; do
            log_error "  - $var"
        done
    fi

    return $(( ${#missing_vars[@]} + ${#invalid_vars[@]} ))
}

# Validate Railway domain
validate_railway_domain() {
    local site_url="${SITE_URL:-https://eduquest-admin.railway.app}"

    if [[ -n "$site_url" && ! "$site_url" == *.railway.app ]]; then
        log_warn "Site URL $site_url does not appear to be a Railway domain"
        return 1
    fi

    return 0
}

# Generate environment template
generate_env_template() {
    local template_file="$1"

    log_info "Generating environment template: $template_file"

    cat > "$template_file" << EOF
# EduQuest Environment Variables Template
# Copy this file to .env.local and fill in your values

# Supabase Project Configuration
# Get these from your Supabase Dashboard -> Settings
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Site URL for authentication callbacks
# Update these values for your environment (localhost, production, etc.)
SITE_URL=http://localhost:3000
AUTH_CALLBACK_URL=http://localhost:3000/auth/callback

# Logging Configuration (optional)
# DEBUG=true  # Enable debug logging
# LOG_LEVEL=DEBUG  # Set log level (DEBUG, INFO, WARN, ERROR)

# Retry Configuration (optional)
# MAX_RETRIES=3  # Maximum retry attempts
# BASE_DELAY=2   # Initial delay between retries in seconds
EOF

    log_success "Environment template generated: $template_file"
}

# Check gitignore for secrets
check_gitignore() {
    local gitignore_file="$1"
    local env_file="$2"

    if [[ -f "$gitignore_file" ]]; then
        # Check if both .env and .env.local patterns exist
        if ! grep -q "^\\.env" "$gitignore_file" || \
           ! grep -q "\\.env\\.local" "$gitignore_file"; then
            log_warn "Some environment patterns missing from gitignore"
            return 1
        fi
    else
        log_error "No .gitignore file found"
        return 1
    fi

    return 0
}