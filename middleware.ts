// middleware.ts
// Auth guard — redirects based on session + profile state.
//
// Rules:
//   No session            → /login            (except /login, /auth/*, /join/*)
//   Session, no profile   → /onboarding/create (except /onboarding/*, /join/*, /auth/*)
//   Session + profile     → proceed normally
//   Session + profile + hitting /login → /together

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest }          from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname }       = request.nextUrl

  // ── Helpers ──────────────────────────────────────────────────
  const isPublic = (p: string) =>
    p.startsWith('/login') ||
    p.startsWith('/auth')  ||
    p.startsWith('/join')

  const isOnboarding = (p: string) =>
    p.startsWith('/onboarding') ||
    p.startsWith('/join')       ||
    p.startsWith('/auth')

  // ── No session → login ────────────────────────────────────────
  if (!user) {
    if (isPublic(pathname)) return response
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Has session — check profile exists ────────────────────────
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('id, household_id')
    .eq('id', user.id)
    .maybeSingle()
  const profile = profileRow as { id: string; household_id: string } | null

  // No profile yet → onboarding (unless already heading there)
  if (!profile) {
    if (isOnboarding(pathname)) return response
    return NextResponse.redirect(new URL('/onboarding/create', request.url))
  }

  // Has profile, hitting /login → app
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/together', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)'],
}
