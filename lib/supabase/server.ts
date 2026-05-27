// lib/supabase/server.ts
// Server-side Supabase client
// Use this in Server Components, Route Handlers, and middleware

import { createServerClient as _createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export function createServerClient() {
  const cookieStore = cookies()

  return _createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — cookies are read-only.
            // The middleware handles session refreshes so this is safe to ignore.
          }
        },
      },
    }
  )
}
