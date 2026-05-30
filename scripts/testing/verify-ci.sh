#!/bin/bash

# CI Pipeline Verification Script
# This script simulates the CI pipeline locally

set -e

echo "🔍 CI Pipeline Verification"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

# 1. Lint check
echo ""
echo "1️⃣  Running ESLint..."
npm run lint
print_status $? "ESLint passed"

# 2. Type check
echo ""
echo "2️⃣  Running TypeScript check..."
npx tsc --noEmit --skipLibCheck
print_status $? "TypeScript check passed"

# 3. Build
echo ""
echo "3️⃣  Building application..."
npm run build
print_status $? "Build successful"

# 4. Install Playwright if not already installed
if [ ! -d "node_modules/playwright" ]; then
    echo ""
    echo "4️⃣  Installing Playwright..."
    npm install -D @playwright/test
    npx playwright install --with-deps
fi

# 5. Run tests (if they exist)
if [ -d "tests" ] || grep -q "test" package.json; then
    echo ""
    echo "5️⃣  Running tests..."
    npm test
    print_status $? "Tests passed"
else
    echo ""
    echo "⚠️  No tests found. Skipping test verification."
fi

# 6. Check if .next directory was created
echo ""
echo "6️⃣  Verifying build output..."
if [ -d ".next" ]; then
    echo -e "${GREEN}✅ Build directory created${NC}"
else
    echo -e "${RED}❌ Build directory not found${NC}"
    exit 1
fi

# 7. Check for critical files
echo ""
echo "7️⃣  Checking for critical files..."
critical_files=(
    ".next/server/app/layout.js"
    ".next/server/app/(dashboard)/page.js"
    ".next/server/manifest.js"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file exists${NC}"
    else
        echo -e "${YELLOW}⚠️  $file not found (may be normal for certain files)${NC}"
    fi
done

echo ""
echo -e "${GREEN}🎉 All CI checks passed! Ready for deployment.${NC}"
echo ""
echo "💡 Next steps:"
echo "   1. Create a pull request to trigger CI"
echo "   2. Check GitHub Actions for CI results"
echo "   3. Merge to main for auto-deployment"