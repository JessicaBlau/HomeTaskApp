'use client'
// app/(auth)/login/page.tsx
// Magic-link login — generic for any household member.

import { useState }     from 'react'
import { useRouter }    from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })

    if (error) { setError(error.message) }
    else       { setSent(true) }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-eyebrow">Welcome home</div>
        <h1 className="login-title">
          Home<br /><em>Team</em>
        </h1>

        {sent ? (
          <>
            <p className="login-sub">
              ✉️ Check your email — we sent a magic link to <strong>{email}</strong>.<br />
              Tap it to sign in instantly.
            </p>
            <p className="login-hint">You can close this tab.</p>
          </>
        ) : (
          <form onSubmit={handleLogin}>
            <p className="login-sub">
              Enter your email and we&apos;ll send you a magic link. No password needed.
            </p>
            <div className="login-input-wrap">
              <input
                className="login-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            {error && (
              <p style={{ color: '#C45A5A', fontSize: '0.8rem', marginBottom: 8 }}>
                {error}
              </p>
            )}
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? 'Sending…' : 'Send magic link →'}
            </button>
            <p className="login-hint">
              New here?{' '}
              <span
                style={{ textDecoration: 'underline', cursor: 'pointer' }}
                onClick={() => router.push('/onboarding/create')}
              >
                Create a household
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
