'use server'

import { signOut } from '@/app/(auth)/login/actions'

export async function logout() {
  await signOut()
}
