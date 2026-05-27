// app/page.tsx
// Root redirect. Supabase sends auth errors here (e.g. otp_expired) — forward
// them to /login so the user sees a helpful message instead of a broken page.

import { redirect } from 'next/navigation'

export default function RootPage({
  searchParams,
}: {
  searchParams: { error?: string; error_code?: string }
}) {
  if (searchParams.error) {
    const code = searchParams.error_code ?? searchParams.error
    redirect(`/login?error=${encodeURIComponent(code)}`)
  }

  redirect('/together')
}
