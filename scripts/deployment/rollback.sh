#!/bin/bash

# Railway Deployment Rollback Script
# This script helps rollback to a previous deployment on Railway

set -e

echo "🚨 Railway Deployment Rollback"
echo "=============================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed. Please install it first:"
    echo "   npm install -g @railway/cli"
    echo "   railway login"
    exit 1
fi

# Get current service
SERVICE=$(railway service --json | jq -r '.[].name' 2>/dev/null || echo "default")

echo "📍 Current service: $SERVICE"

# List recent deployments
echo ""
echo "📋 Recent deployments:"
railway deployments --limit 5 --json | jq -r '.[] | "\(.id[:8]} - \(.status) - \(.createdAt)"'

# Ask for deployment ID to rollback to
echo ""
read -p "🔄 Enter deployment ID to rollback to (or press Enter for previous): " DEPLOYMENT_ID

if [ -z "$DEPLOYMENT_ID" ]; then
    echo "🔄 Rolling back to previous deployment..."
    railway rollback
else
    echo "🔄 Rolling back to deployment: $DEPLOYMENT_ID"
    railway rollback --deployment "$DEPLOYMENT_ID"
fi

echo "✅ Rollback initiated. Check Railway dashboard for status."
echo ""
echo "💡 Tips:"
echo "   - Monitor the rollback in Railway dashboard"
echo "   - Check logs for any errors"
echo "   - Verify the application is working after rollback"
echo "   - If issues persist, you can rollback again"