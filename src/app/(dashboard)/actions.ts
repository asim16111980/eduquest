'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/(auth)/login/actions'

export async function logout() {
  await signOut()
}
