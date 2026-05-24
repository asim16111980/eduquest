'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Make sure that the client-side object is always the same as the server-side
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}