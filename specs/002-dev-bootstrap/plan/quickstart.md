# EduQuest Admin Dashboard - Development Bootstrap Quickstart

**Date**: 2026-05-18  
**Version**: 1.0  
**Target Audience**: Developers  
**Time Estimate**: 10 minutes

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.0 or later
- **npm** (comes with Node.js)
- **Supabase CLI** - Install with: `npm install -g supabase`
- **Railway account** - Sign up at [railway.app](https://railway.app)

## Quick Setup

### Step 1: Create Next.js App

```bash
# Create the project
npx create-next-app@latest eduquest-admin \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

# Navigate to the project
cd eduquest-admin
```

### Step 2: Install Dependencies

```bash
# Core dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# Development dependencies
npm install --save-dev @types/node @types/react @types/react-dom
```

### Step 3: Configure Environment

Create `.env.local` in the root directory:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application URL
NEXTAUTH_URL=http://localhost:3000
```

> **Note**: Get these values from your Supabase project dashboard

### Step 4: Setup TypeScript Configuration

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Step 5: Configure Tailwind CSS

Update `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... other color definitions
      },
    },
  },
  plugins: [],
};
export default config;
```

### Step 6: Create Project Structure

```bash
# Create necessary directories
mkdir -p src/{app,components,lib,styles}

# Create app structure
mkdir -p src/app/{\(auth\),\(dashboard\)/\(login,overview\)}
mkdir -p src/app/api
mkdir -p src/components/{shared,charts}
mkdir -p src/lib/{supabase,types,queries}
mkdir -p src/styles
```

### Step 7: Create Supabase Client Helpers

Create `src/lib/supabase/server.ts`:

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerComponentClient({
    cookies: () => cookieStore,
    supabaseKey: process.env.SUPABASE_ANON_KEY!,
  })
}
```

Create `src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'

export function createClient() {
  return createBrowserClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  )
}
```

Create `src/lib/supabase/middleware.ts`:

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Refresh session if expired - required for PKCE flow
  await supabase.auth.getUser()

  // Protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // Redirect to login
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

### Step 8: Test Development Server

```bash
# Start the development server
npm run dev

# Test that it builds
npm run build
```

Visit `http://localhost:3000` - you should see the Next.js default page.

### Step 9: Configure ESLint and Prettier

Create `.eslintrc.js`:

```javascript
module.exports = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    'no-console': 'error',
  },
}
```

Create `.prettierrc`:

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

Install ESLint and Prettier:

```bash
npm install --save-dev eslint prettier eslint-config-next eslint-plugin-typescript
```

### Step 10: Setup GitHub Actions CI

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Type check
        run: npx tsc --noEmit
        
      - name: Lint
        run: npm run lint
        
      - name: Build
        run: npm run build
```

## Verify Setup

Run these commands to verify everything is working:

```bash
# Type check (should pass without errors)
npx tsc --noEmit

# Lint (should pass without errors)
npm run lint

# Build (should succeed)
npm run build

# Development server (should start without errors)
npm run dev
```

## Next Steps

1. **Authentication**: Implement login page and auth actions
2. **Type Generation**: Run `supabase gen types typescript --local`
3. **Dashboard Pages**: Create protected dashboard routes
4. **Database Integration**: Connect to Supabase for data operations
5. **Deployment**: Configure Railway auto-deployment

## Troubleshooting

### Common Issues

**TypeScript Errors**:
- Ensure all environment variables are set
- Check path aliases in `tsconfig.json`
- Verify `@/*` imports work correctly

**Supabase Connection**:
- Verify URL and keys in `.env.local`
- Ensure Supabase project is active
- Check network connectivity

**Build Failures**:
- Run `npm install` to ensure all dependencies are installed
- Check for TypeScript errors first
- Verify all required files exist

---

## Support

If you encounter issues:
1. Check the [Next.js documentation](https://nextjs.org/docs)
2. Review [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
3. Consult the [Constitution](../../.specify/memory/constitution.md) for project guidelines

---

Happy coding! 🚀