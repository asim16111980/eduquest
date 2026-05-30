# Quickstart: Development Bootstrap for EduQuest Admin Dashboard

**Branch**: `002-dev-bootstrap`  
**Date**: 2026-05-25  
**Context**: Step-by-step setup guide for new developers

---

## Prerequisites

Before starting, ensure you have:

- Node.js 20+ installed
- npm 11+ installed
- Git installed
- Supabase CLI installed (`npm install -g supabase`)
- Supabase project created at [supabase.com](https://supabase.com)

---

## Setup Steps

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/YOUR_ORG/eduquest.git
cd eduquest

# Checkout the feature branch
git checkout 002-dev-bootstrap

# Install dependencies
npm install
```

---

### 2. Configure Environment

```bash
# Copy the .env.local template
cp .env.local.example .env.local

# Edit .env.local with your Supabase credentials
# Open .env.local in your editor and fill in:
# - SUPABASE_URL (e.g., https://xyz.supabase.co)
# - SUPABASE_ANON_KEY (e.g., eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)
# - SUPABASE_SERVICE_ROLE_KEY (e.g., eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)
# - SUPABASE_PROJECT_REF (e.g., xyz)
# - SUPABASE_DB_URL (e.g., postgresql://postgres:password@db.xyz.supabase.co:5432/postgres)
# - SUPABASE_API_URL (e.g., https://api.xyz.supabase.co)
```

---

### 3. Initialize Development Server

```bash
# Start the development server
npm run dev

# Verify the server starts on localhost:3000
# Open http://localhost:3000 in your browser
# Confirm no TypeScript errors in the console
```

---

### 4. Configure Supabase CLI (Optional)

```bash
# If you want to run Supabase locally
supabase start

# Generate local database types (if local Supabase running)
supabase gen types typescript --local > src/lib/types/schema.ts
```

---

### 5. Verify Setup

```bash
# Run linting
npm run lint

# Run type check
npm run typecheck

# Run build
npm run build

# All commands should exit with code 0 (success)
```

---

## Testing the Setup

### Test 1: Development Server

```bash
# In one terminal
npm run dev

# In another terminal
curl http://localhost:3000
# Should return HTML for the home page
```

### Test 2: API Test Route (User Story 2)

```bash
# Visit http://localhost:3000/api/test
# Should return JSON with Supabase connection status
# Example response:
# {
#   "connected": true,
#   "message": "Successfully connected to Supabase"
# }
```

### Test 3: Authentication Flow (User Story 3)

```bash
# Visit http://localhost:3000/dashboard
# Should redirect to login page (http://localhost:3000/login)

# Login with valid credentials
# Should redirect to dashboard

# Logout
# Should redirect back to login
```

### Test 4: Type Safety (User Story 4)

```bash
# Open any component file (e.g., src/components/shared/LoginForm.tsx)
# Verify all imports use defined types
# Example:
# import type { UserRole } from '@/lib/types'

# Run TypeScript compiler
npx tsc --noEmit
# Should report no errors
```

---

## Troubleshooting

### Issue: " SUPABASE_URL not set"

**Solution**: Ensure `.env.local` contains the `SUPABASE_URL` variable with a valid Supabase project URL.

---

### Issue: "TypeScript Error: Cannot find module"

**Solution**: Ensure all path aliases (`@/*`) are configured in `tsconfig.json`. Verify `@` maps to `./src`.

---

### Issue: "Supabase connection refused"

**Solution**: 
1. Verify Supabase project is running
2. Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
3. Verify network connectivity to Supabase
4. Test with `curl` or Postman directly

---

### Issue: "Middleware client cannot read cookies"

**Solution**: Ensure middleware reads cookies synchronously (Next.js middleware API requires sync operations). Example:

```typescript
// src/lib/supabase/middleware.ts
export async function createMiddlewareClient(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  // Parse cookie synchronously
}
```

---

## Next Steps

After successful setup:

1. **User Story 1**: Verify development environment (already done)
2. **User Story 2**: Configure Supabase integration (test route, API queries)
3. **User Story 3**: Test authentication flow (login, logout, redirects)
4. **User Story 4**: Define type safety (domain types, component imports)
5. **User Story 5**: Set up CI/CD pipeline (GitHub Actions, Railway deployment)

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **TypeScript Docs**: https://www.typescriptlang.org/docs
- **Project Issues**: https://github.com/YOUR_ORG/eduquest/issues
