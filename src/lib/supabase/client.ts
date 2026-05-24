'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Make sure that the client-side object is always the same as the server-side
  return createBrowserClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  )
}