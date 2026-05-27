'use client'
// app/join/[code]/page.tsx
// Invite landing page — accessible without auth.
//
// Flow A (not logged in):
//   Show form → name + color + email → save {name,color} to localStorage
//   → fire magic link → /auth/callback?next=/join/[code]
//   → land back here logged in → read localStorage → create profile → /together
//
// Flow B (logged in, no profile):
//   Read localStorage if set, show form if not → create profile → /together

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient }         from '@/lib/supabase/client'

const COLORS = [
  '#C4714A', '#4A7F96', '#6A9060', '#9B6DB5', '#E8B87A',
  '#C45A5A', '#4A8B9A', '#B07A4A', '#7A6098', '#5A8A70',
]

const LS_KEY = 'ht_pending_join'

interface InviteInfo {
  household_id:   string
  household_name: string
  invite_role:    string
  invite_id:      string
}

export default function JoinPage() {
  const params   = useParams<{ code: string }>()
  const code     = params.code
  const router   = useRouter()
  const supabase = createClient()

  const [invite,   setInvite]   = useState<InviteInfo | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [authed,   setAuthed]   = useState<boolean | null>(null)  // null = loading
  const [hasProfile, setHasProfile] = useState(false)

  const [name,    setName]    = useState('')
  const [color,   setColor]   = useState(COLORS[0])
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  // ── 1. Fetch invite info and auth state on mount ──────────────
  useEffect(() => {
    let mounted = true

    async function init() {
      // Fetch invite details (uses SECURITY DEFINER function — no RLS needed)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).rpc('get_household_for_invite', { p_code: code })
      const info = (data as InviteInfo[] | null)?.[0] ?? null

      if (!info) { if (mounted) setNotFound(true); return }
      if (mounted) setInvite(info)

      // Check auth state
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return
      setAuthed(!!user)

      if (user) {
        // Check if they already have a profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()
        if (!mounted) return
        setHasProfile(!!profile)

        // Auto-populate name from localStorage if available
        try {
          const saved = localStorage.getItem(LS_KEY)
          if (saved) {
            const { name: savedName, color: savedColor } = JSON.parse(saved)
            if (savedName) setName(savedName)
            if (savedColor) setColor(savedColor)
          }
        } catch { /* ignore */ }
      }
    }

    init()
    return () => { mounted = false }
  }, [supabase, code])

  // ── 2. Auto-join if logged in + have stored data + no profile ──
  useEffect(() => {
    if (!invite || authed !== true || hasProfile) return

    const saved = (() => {
      try { return JSON.parse(localStorage.getItem(LS_KEY) ?? 'null') } catch { return null }
    })()

    if (saved?.name && saved?.color && saved?.auto) {
      handleCreateProfile(saved.name, saved.color)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invite, authed, hasProfile])

  // ── Handlers ──────────────────────────────────────────────────
  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setLoading(true)
    setError('')

    // Persist form data so we can read it after magic-link redirect
    localStorage.setItem(LS_KEY, JSON.stringify({ name: name.trim(), color, auto: true }))

    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/join/${code}`,
      },
    })

    if (otpErr) { setError(otpErr.message); setLoading(false) }
    else setSent(true)
    setLoading(false)
  }

  async function handleCreateProfile(profileName: string, profileColor: string) {
    if (!invite) return
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in.'); setLoading(false); return }

    // Create the profile in the invited household
    const { error: pErr } = await supabase
      .from('profiles')
      .insert({
        id:           user.id,
        household_id: invite.household_id,
        name:         profileName.trim(),
        color:        profileColor,
        role:         invite.invite_role as 'adult' | 'child',
      } as never)

    if (pErr) { setError(pErr.message); setLoading(false); return }

    // Increment invite use_count
    await supabase
      .from('household_invites')
      .update({ use_count: 999 } as never)   // mark as used
      .eq('id', invite.invite_id)

    localStorage.removeItem(LS_KEY)
    router.push('/together')
  }

  async function handleJoinSubmit(e: React.FormEvent) {
    e.preventDefault()
    await handleCreateProfile(name, color)
  }

  // ── Render states ─────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-eyebrow">Invalid link</div>
          <h1 className="login-title">This invite<br /><em>expired</em></h1>
          <p className="login-sub">Ask your household to generate a new invite link.</p>
        </div>
      </div>
    )
  }

  if (authed === null || !invite) {
    return (
      <div className="login-page">
        <div className="login-card">
          <p className="login-sub" style={{ textAlign: 'center' }}>Loading…</p>
        </div>
      </div>
    )
  }

  if (hasProfile) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-eyebrow">Already set up</div>
          <h1 className="login-title">You&apos;re already<br /><em>in a household</em></h1>
          <p className="login-sub">
            You can&apos;t join a second household right now. Sign out first if you want to switch.
          </p>
          <button className="login-btn" onClick={() => router.push('/together')}>
            Go to your household →
          </button>
        </div>
      </div>
    )
  }

  if (sent) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-eyebrow">Check your email</div>
          <h1 className="login-title">Magic link<br /><em>sent!</em></h1>
          <p className="login-sub">
            ✉️ We sent a link to <strong>{email}</strong>.<br />
            Tap it to finish joining <strong>{invite.household_name}</strong>.
          </p>
          <p className="login-hint">You can close this tab.</p>
        </div>
      </div>
    )
  }

  // Logged in but no profile → show join form (no email needed)
  if (authed) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-eyebrow">You&apos;re invited</div>
          <h1 className="login-title">
            Join<br /><em>{invite.household_name}</em>
          </h1>
          <p className="login-sub">
            Set up your profile to get started.
            {invite.invite_role === 'child' && ' You&apos;re joining as a member.'}
          </p>

          <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="onboard-label">Your name</label>
              <div className="login-input-wrap">
                <input
                  className="login-input"
                  placeholder='e.g. "Naor"'
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="onboard-label">Your color</label>
              <div className="color-swatches">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch${color === c ? ' active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
            </div>

            {error && <p style={{ color: '#C45A5A', fontSize: '0.8rem', margin: 0 }}>{error}</p>}

            <button className="login-btn" type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Joining…' : `Join ${invite.household_name} →`}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Not logged in → show full form (name + color + email)
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-eyebrow">You&apos;re invited</div>
        <h1 className="login-title">
          Join<br /><em>{invite.household_name}</em>
        </h1>
        <p className="login-sub">
          Create your account to join the household.
        </p>

        <form onSubmit={handleSendLink} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="onboard-label">Your name</label>
            <div className="login-input-wrap">
              <input
                className="login-input"
                placeholder='e.g. "Naor"'
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="onboard-label">Your color</label>
            <div className="color-swatches">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch${color === c ? ' active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="onboard-label">Your email</label>
            <div className="login-input-wrap">
              <input
                className="login-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <p style={{ color: '#C45A5A', fontSize: '0.8rem', margin: 0 }}>{error}</p>}

          <button
            className="login-btn"
            type="submit"
            disabled={loading || !name.trim() || !email.trim()}
          >
            {loading ? 'Sending…' : 'Send magic link →'}
          </button>
        </form>
      </div>
    </div>
  )
}
