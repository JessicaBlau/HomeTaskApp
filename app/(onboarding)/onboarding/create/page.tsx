'use client'
// app/(onboarding)/create/page.tsx
// New household setup — shown after first login when no profile exists yet.
// Creates a household row and the user's profile in one flow.

import { useState }        from 'react'
import { useRouter }       from 'next/navigation'
import { createClient }    from '@/lib/supabase/client'

const COLORS = [
  '#C4714A', '#4A7F96', '#6A9060', '#9B6DB5', '#E8B87A',
  '#C45A5A', '#4A8B9A', '#B07A4A', '#7A6098', '#5A8A70',
]

export default function CreateHouseholdPage() {
  const router  = useRouter()
  const supabase = createClient()

  const [householdName, setHouseholdName] = useState('')
  const [yourName,      setYourName]      = useState('')
  const [color,         setColor]         = useState(COLORS[0])
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!householdName.trim() || !yourName.trim()) return

    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in.'); setLoading(false); return }

    // Pre-generate the household UUID so we can use it immediately
    // without needing a SELECT after INSERT (which would fail RLS before profile exists).
    const householdId = crypto.randomUUID()

    // 1. Create the household
    const { error: hErr } = await supabase
      .from('households')
      .insert({ id: householdId, name: householdName.trim(), created_by: user.id } as never)

    if (hErr) {
      setError(hErr.message)
      setLoading(false)
      return
    }

    // 2. Create the profile (household_id is already known)
    const { error: pErr } = await supabase
      .from('profiles')
      .insert({
        id:           user.id,
        household_id: householdId,
        name:         yourName.trim(),
        color,
        role:         'adult',
      } as never)

    if (pErr) {
      setError(pErr.message)
      setLoading(false)
      return
    }

    router.push('/together')
  }

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 400 }}>
        <div className="login-eyebrow">Let&apos;s get started</div>
        <h1 className="login-title">
          Create your<br /><em>household</em>
        </h1>
        <p className="login-sub">
          This takes 30 seconds. You can invite your partner straight after.
        </p>

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Household name */}
          <div>
            <label className="onboard-label">Household name</label>
            <div className="login-input-wrap">
              <input
                className="login-input"
                placeholder='e.g. "The Smiths" or "Jessica & Naor"'
                value={householdName}
                onChange={e => setHouseholdName(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          {/* Your name */}
          <div>
            <label className="onboard-label">Your name</label>
            <div className="login-input-wrap">
              <input
                className="login-input"
                placeholder='e.g. "Jessica"'
                value={yourName}
                onChange={e => setYourName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Color picker */}
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

          {error && (
            <p style={{ color: '#C45A5A', fontSize: '0.8rem', margin: 0 }}>{error}</p>
          )}

          <button className="login-btn" type="submit" disabled={loading || !householdName.trim() || !yourName.trim()}>
            {loading ? 'Creating…' : 'Create household →'}
          </button>
        </form>
      </div>
    </div>
  )
}
