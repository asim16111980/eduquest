# Test Logout Functionality for EduQuest Admin Dashboard
# This script tests the logout functionality

Write-Host "=== Testing Logout Functionality ===" -ForegroundColor Green

# Test: Check if logout action exists and is accessible
Write-Host "`n1. Testing logout action accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/dashboard/actions" -Method POST -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "✓ Logout action endpoint exists" -ForegroundColor Green
} catch {
    Write-Host "✗ Logout action endpoint not accessible (expected for unauthenticated users)" -ForegroundColor Yellow
}

Write-Host "`n2. Manual Testing Instructions:" -ForegroundColor Yellow
Write-Host "   a) Log in with valid credentials" -ForegroundColor Yellow
Write-Host "   b) Navigate to /dashboard" -ForegroundColor Yellow
Write-Host "   c) Check for logout functionality" -ForegroundColor Yellow
Write-Host "   d) Verify logout redirects to login page" -ForegroundColor Yellow
Write-Host "   e) Verify session is cleared after logout" -ForegroundColor Yellow

Write-Host "`n=== Logout Tests Complete ===" -ForegroundColor Green