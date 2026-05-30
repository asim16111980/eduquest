/**
 * Security Headers Configuration
 *
 * Contains security headers to be applied via middleware
 * Based on OWASP secure headers recommendations
 */

export const SecurityHeaders = {
  // Content Security Policy - prevents XSS attacks
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://cdn.jsdelivr.net; connect-src 'self' https://*.supabase.co; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';",

  // Strict Transport Security - forces HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // X-Content-Type-Options - prevents MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // X-Frame-Options - prevents clickjacking
  'X-Frame-Options': 'DENY',

  // X-XSS-Protection - enables XSS filtering in older browsers
  'X-XSS-Protection': '1; mode=block',

  // Referrer Policy - controls referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions Policy - controls browser features
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',

  // Cache-Control for sensitive pages
  'Cache-Control': 'no-store, max-age=0, must-revalidate',

  // Clear site data on logout (handled by auth)
  'Clear-Site-Data': 'cache, cookies, storage'
} as const