#!/bin/bash

# Phase 0A Verification Script
# Purpose: Verify that all Phase 0A requirements are met

set -e

# Source shared utilities
source "$(dirname "$0")/../lib/logging.sh"

echo "================================================"
echo "   EduQuest Phase 0A Verification"
echo "================================================"
echo ""

# Verification flags
FAILED=0
PROJECT_REF=""
PROJECT_STATUS=""

# Check 1: Supabase Project Exists
echo "1. Checking Supabase project existence..."
PROJECT_JSON=$(supabase projects list --json 2>/dev/null | grep eduquest || true)

if [[ -n "$PROJECT_JSON" ]]; then
    echo "✅ Supabase project 'eduquest' exists"
    
    # Parse project details from JSON
    PROJECT_REF=$(echo "$PROJECT_JSON" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    PROJECT_STATUS=$(echo "$PROJECT_JSON" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [[ -n "$PROJECT_REF" ]]; then
        echo "   Project Reference: $PROJECT_REF"
    else
        echo "❌ Failed to extract project reference"
        FAILED=1
    fi

    # Check project status
    if [[ "$PROJECT_STATUS" == "active" ]]; then
        echo "✅ Project is active/linked"
    else
        echo "❌ Project is paused ($PROJECT_STATUS) - requires admin unpause from dashboard"
        echo "   Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF"
        FAILED=1
    fi
else
    echo "❌ Supabase project 'eduquest' not found"
    exit 1
fi

# Check 2: Configuration Files
echo ""
echo "2. Checking configuration files..."
if [[ -f "supabase/config.toml" ]]; then
    echo "✅ supabase/config.toml exists"
    if grep -q "ref = \"$PROJECT_REF\"" supabase/config.toml; then
        echo "✅ Project reference correctly configured"
    else
        echo "❌ Project reference not configured in config.toml"
        FAILED=1
    fi
else
    echo "❌ supabase/config.toml not found"
    exit 1
fi

# Check 3: Environment Variables
echo ""
echo "3. Checking environment configuration..."
if [[ -f ".env.local" ]]; then
    echo "✅ .env.local exists"

    # Check if variables are set (but don't display values)
    if grep -q "SUPABASE_URL=" .env.local && grep -q "SUPABASE_ANON_KEY=" .env.local; then
        echo "✅ Required Supabase variables present"
    else
        echo "❌ Missing required Supabase variables"
        exit 1
    fi

    if grep -q "SITE_URL=" .env.local && grep -q "eduquest-admin.railway.app" .env.local; then
        echo "✅ Railway site URL configured"
    else
        echo "❌ Railway site URL not properly configured"
        exit 1
    fi
else
    echo "❌ .env.local not found"
    exit 1
fi

# Check 4: Security Configuration
echo ""
echo "4. Checking security configuration..."
if [[ -f "sql/enable-rls.sql" ]]; then
    echo "✅ RLS enablement script exists"
else
    echo "❌ RLS enablement script not found"
    exit 1
fi

# Check 5: Setup Scripts
echo ""
echo "5. Checking setup scripts..."
SETUP_SCRIPTS=(
    "scripts/setup/supabase-project-setup.sh"
    "scripts/setup/security-config.sh"
    "scripts/setup/realtime-setup.sh"
)

for script in "${SETUP_SCRIPTS[@]}"; do
    if [[ -f "$script" ]]; then
        echo "✅ $script exists"
    else
        echo "❌ $script not found"
        exit 1
    fi
done

# Check 6: Verification Scripts
echo ""
echo "6. Checking verification scripts..."
VERIFICATION_SCRIPTS=(
    "scripts/verify/project-connection.sh"
    "scripts/verify/security-verification.sh"
    "scripts/verify/verify-realtime.sh"
)

for script in "${VERIFICATION_SCRIPTS[@]}"; do
    if [[ -f "$script" ]]; then
        echo "✅ $script exists"
    else
        echo "❌ $script not found"
        exit 1
    fi
done

# Check 7: Git Protection
echo ""
echo "7. Checking git protection..."
if grep -q "\.env" .gitignore; then
    echo "✅ Environment variables protected in .gitignore"
else
    echo "❌ Environment variables not protected in .gitignore"
    exit 1
fi

# Check 8: CLI Authentication
echo ""
echo "8. Checking CLI authentication..."
if supabase login status >/dev/null 2>&1; then
    echo "✅ Supabase CLI is authenticated"
else
    echo "❌ Supabase CLI not authenticated - run 'supabase login'"
    FAILED=1
fi

# Final verification check
if [[ $FAILED -eq 1 ]]; then
    echo ""
    echo "================================================"
    echo "   Phase 0A Verification FAILED"
    echo "================================================"
    echo ""
    echo "Please address the issues above before proceeding."
    exit 1
fi

echo ""
echo "================================================"
echo "   Phase 0A Status: READY FOR NEXT PHASE"
echo "================================================"
echo ""
echo "Next Steps:"
echo "1. Admin must unpause the project at: https://supabase.com/dashboard/project/$PROJECT_REF"
echo "2. Add real API keys to Railway environment variables and .env.local"
echo "3. Run Phase 1 migrations: ./scripts/setup/phase1-migrate.sh"
echo ""
echo "Phase 0A Checklist:"
echo "✅ Supabase project created"
echo "✅ Configuration files ready"
echo "✅ Security scripts prepared"
echo "✅ Environment templates created"
echo "✅ Verification scripts in place"
echo "⏳ Awaiting project unpause and real API keys"