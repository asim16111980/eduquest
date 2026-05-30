// Simple test script to verify login functionality
const fs = require('fs');
const path = require('path');

// Read the login page HTML
const loginPath = path.join(__dirname, 'test-login.html');
if (fs.existsSync(loginPath)) {
  const content = fs.readFileSync(loginPath, 'utf8');

  // Check for development mode indicators
  if (content.includes('Development Mode')) {
    console.log('✅ Development mode message is showing');
  } else {
    console.log('❌ Development mode message not found');
  }

  // Check for test user emails
  if (content.includes('admin@eduquest.com')) {
    console.log('✅ Admin user email mentioned');
  } else {
    console.log('❌ Admin user email not found');
  }

  if (content.includes('teacher@eduquest.com')) {
    console.log('✅ Teacher user email mentioned');
  } else {
    console.log('❌ Teacher user email not found');
  }

  if (content.includes('student@eduquest.com')) {
    console.log('✅ Student user email mentioned');
  } else {
    console.log('❌ Student user email not found');
  }
} else {
  console.log('❌ Test login HTML file not found');
  console.log('Please visit http://localhost:3000/login and save the page as test-login.html');
}