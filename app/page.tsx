// app/page.tsx
// Root redirect.
//
// Supabase occasionally lands auth tokens here instead of /auth/callback
// (happens when the redirect URL isn't whitelisted yet).
// Forward both ?code= and ?error= to the right handler.

import { redirect } from 'next/navigation'

export default function RootPage({
  searchParams,
}: {
  searchParams: { code?: string; error?: string; error_code?: string; next?: string }
}) {
  // Auth code landed here instead of /auth/callback — forward it
  if (searchParams.code) {
    const next = searchParams.next ? `&next=${encodeURIComponent(searchParams.next)}` : ''
    redirect(`/auth/callback?code=${searchParams.code}${next}`)
  }

  // Supabase error (e.g. otp_expired) — forward to login with message
  if (searchParams.error) {
    const code = searchParams.error_code ?? searchParams.error
    redirect(`/login?error=${encodeURIComponent(code)}`)
  }

  redirect('/together')
}
