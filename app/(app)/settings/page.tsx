'use client'
// app/(app)/settings/page.tsx
// Household settings — name, members, invite link.

import { useState }             from 'react'
import { useRouter }            from 'next/navigation'
import { useCurrentProfile }    from '@/lib/hooks/useCurrentProfile'
import { useProfiles }          from '@/lib/hooks/useProfiles'
import { createClient }         from '@/lib/supabase/client'

export default function SettingsPage() {
  const router                         = useRouter()
  const { profile, household, loading: profLoading } = useCurrentProfile()
  const { profiles }                   = useProfiles()
  const supabase                       = createClient()

  const [editingName, setEditingName]  = useState(false)
  const [newName,     setNewName]      = useState('')
  const [saving,      setSaving]       = useState(false)

  const isAdult = profile?.role === 'adult'

  async function saveHouseholdName() {
    if (!household || !newName.trim()) { setEditingName(false); return }
    setSaving(true)
    await supabase
      .from('households')
      .update({ name: newName.trim() } as never)
      .eq('id', household.id)
    setSaving(false)
    setEditingName(false)
    // Reload to reflect change
    window.location.reload()
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (profLoading) {
    return (
      <div style={{ padding: 'var(--space-6)', color: 'var(--ink-faint)', textAlign: 'center' }}>
        Loading…
      </div>
    )
  }

  return (
    <div className="settings-page">

      {/* ── Household ── */}
      <section className="settings-section">
        <div className="settings-heading">Household</div>

        <div className="settings-row">
          <span className="settings-row-label">Name</span>
          {editingName ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
              <input
                className="settings-inline-input"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter')  saveHouseholdName()
                  if (e.key === 'Escape') setEditingName(false)
                }}
                autoFocus
              />
              <button className="settings-save-btn" onClick={saveHouseholdName} disabled={saving}>
                {saving ? '…' : 'Save'}
              </button>
            </div>
          ) : (
            <span
              className="settings-row-value"
              onClick={() => {
                if (!isAdult) return
                setNewName(household?.name ?? '')
                setEditingName(true)
              }}
              style={{ cursor: isAdult ? 'pointer' : 'default' }}
            >
              {household?.name ?? '—'}
              {isAdult && <span className="settings-edit-hint"> ✏️</span>}
            </span>
          )}
        </div>

        <div className="settings-row">
          <span className="settings-row-label">Plan</span>
          <span className="settings-row-value">
            <span className={`plan-badge ${household?.plan ?? 'free'}`}>
              {household?.plan === 'pro' ? '⭐ Pro' : 'Free'}
            </span>
          </span>
        </div>
      </section>

      {/* ── Members ── */}
      <section className="settings-section">
        <div className="settings-heading">Members</div>

        {profiles.map(p => (
          <div key={p.id} className="member-row">
            <div className="member-dot" style={{ background: p.color }} />
            <div className="member-info">
              <div className="member-name">
                {p.name}
                {p.id === profile?.id && <span className="member-you"> (you)</span>}
              </div>
              <div className="member-role">{p.role}</div>
            </div>
          </div>
        ))}

        {isAdult && (
          <button
            className="settings-invite-btn"
            onClick={() => router.push('/settings/invite')}
          >
            + Invite someone
          </button>
        )}
      </section>

      {/* ── Danger zone ── */}
      <section className="settings-section">
        <div className="settings-heading">Account</div>
        <button className="settings-signout-btn" onClick={signOut}>
          Sign out
        </button>
      </section>

    </div>
  )
}
