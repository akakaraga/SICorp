import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { createMockClient } from './mock-client'

export async function createClient() {
  const cookieStore = await cookies()

  // Gunakan mock client jika USE_DUMMY_DATA=true (untuk demo tanpa Supabase)
  if (process.env.USE_DUMMY_DATA === 'true') {
    const dummyUserId = cookieStore.get('dummy_user_id')?.value || 'user-hrd-001'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createMockClient(dummyUserId) as any
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // Cookies can only be set in a Server Action or Route Handler.
          }
        },
      },
    }
  )
}

