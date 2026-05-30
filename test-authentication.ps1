# Test Authentication Flow for EduQuest Admin Dashboard
# This script tests the authentication middleware and login functionality

Write-Host "=== Testing Authentication Flow ===" -ForegroundColor Green

# Test 1: Check if login page loads without authentication
Write-Host "`n1. Testing access to dashboard without authentication..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/dashboard" -UseBasicParsing -ErrorAction Stop -MaximumRedirection 0
    Write-Host "✗ Expected redirect but got response: $($response.StatusCode)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 302) {
        Write-Host "✓ Dashboard correctly redirects to login page" -ForegroundColor Green
    } else {
        Write-Host "✗ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 2: Check if login page is accessible
Write-Host "`n2. Testing access to login page..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/login" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Login page is accessible" -ForegroundColor Green
        # Check for form elements
        if ($response.Content -match 'id="email"') {
            Write-Host "✓ Email input field found" -ForegroundColor Green
        }
        if ($response.Content -match 'id="password"') {
            Write-Host "✓ Password input field found" -ForegroundColor Green
        }
        if ($response.Content -match 'type="submit"') {
            Write-Host "✓ Submit button found" -ForegroundColor Green
        }
    } else {
        Write-Host "✗ Login page returned status code: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Failed to access login page" -ForegroundColor Red
}

# Test 3: Check if API routes are protected
Write-Host "`n3. Testing API route protection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/test" -UseBasicParsing -ErrorAction Stop -MaximumRedirection 0
    # Should not get here - 401 should throw
    Write-Host "✗ Expected 401 but got response: $($response.StatusCode)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ API route correctly returns 401 when not authenticated" -ForegroundColor Green
    } else {
        Write-Host "✗ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 4: Check if login form validation works
Write-Host "`n4. Testing login form validation..." -ForegroundColor Yellow
Write-Host "   (Manual check required:)" -ForegroundColor Yellow
Write-Host "   - Open http://localhost:3000/login in browser" -ForegroundColor Yellow
Write-Host "   - Try submitting with empty fields" -ForegroundColor Yellow
Write-Host "   - Try submitting with invalid email format" -ForegroundColor Yellow
Write-Host "   - Check for appropriate error messages" -ForegroundColor Yellow

Write-Host "`n=== Authentication Tests Complete ===" -ForegroundColor Green
