'use client'
// app/(app)/settings/invite/page.tsx
// Generate and manage invite links for the household.

import { useEffect, useState }  from 'react'
import { useCurrentProfile }    from '@/lib/hooks/useCurrentProfile'
import { createClient }         from '@/lib/supabase/client'
import type { HouseholdInvite } from '@/lib/supabase/types'

export default function InvitePage() {
  const { profile, household, loading } = useCurrentProfile()
  const supabase                        = createClient()

  const [invites,    setInvites]    = useState<HouseholdInvite[]>([])
  const [role,       setRole]       = useState<'adult' | 'child'>('adult')
  const [generating, setGenerating] = useState(false)
  const [copied,     setCopied]     = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    supabase
      .from('household_invites')
      .select('*')
      .eq('household_id', profile.household_id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setInvites((data ?? []) as unknown as HouseholdInvite[]))
  }, [supabase, profile])

  async function generateInvite() {
    if (!profile) return
    setGenerating(true)

    const { data, error } = await supabase
      .from('household_invites')
      .insert({
        household_id: profile.household_id,
        created_by:   profile.id,
        role,
        max_uses:     1,
      } as never)
      .select('*')
      .single()

    if (!error && data) {
      setInvites(prev => [data as unknown as HouseholdInvite, ...prev])
    }
    setGenerating(false)
  }

  async function revokeInvite(inviteId: string) {
    await supabase.from('household_invites').delete().eq('id', inviteId)
    setInvites(prev => prev.filter(i => i.id !== inviteId))
  }

  function copyLink(code: string) {
    const url = `${window.location.origin}/join/${code}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(code)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  function inviteUrl(code: string) {
    return `${window.location.origin}/join/${code}`
  }

  if (loading) return (
    <div style={{ padding: 'var(--space-6)', color: 'var(--ink-faint)', textAlign: 'center' }}>
      Loading…
    </div>
  )

  const activeInvites = invites.filter(i => i.use_count < i.max_uses)

  return (
    <div className="settings-page">

      <section className="settings-section">
        <div className="settings-heading">Invite someone to {household?.name}</div>
        <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginBottom: 'var(--space-4)' }}>
          Generate a one-time link. The person who clicks it can create their account
          and join your household automatically.
        </p>

        {/* Role selector */}
        <div className="invite-role-row">
          <span className="settings-row-label">Join as</span>
          <div className="role-toggle">
            <button
              type="button"
              className={`role-btn${role === 'adult' ? ' active' : ''}`}
              onClick={() => setRole('adult')}
            >
              Adult
            </button>
            <button
              type="button"
              className={`role-btn${role === 'child' ? ' active' : ''}`}
              onClick={() => setRole('child')}
            >
              Child
            </button>
          </div>
        </div>

        <button
          className="login-btn"
          style={{ marginTop: 'var(--space-3)', width: '100%' }}
          onClick={generateInvite}
          disabled={generating}
        >
          {generating ? 'Generating…' : '+ Generate invite link'}
        </button>
      </section>

      {/* Active invites */}
      {activeInvites.length > 0 && (
        <section className="settings-section">
          <div className="settings-heading">Active links</div>
          {activeInvites.map(invite => (
            <div key={invite.id} className="invite-row">
              <div className="invite-info">
                <div className="invite-code">{invite.code}</div>
                <div className="invite-meta">
                  {invite.role} · {invite.use_count}/{invite.max_uses} uses
                </div>
                <div className="invite-url">{inviteUrl(invite.code)}</div>
              </div>
              <div className="invite-actions">
                <button
                  className="invite-copy-btn"
                  onClick={() => copyLink(invite.code)}
                >
                  {copied === invite.code ? '✓ Copied' : 'Copy'}
                </button>
                <button
                  className="invite-revoke-btn"
                  onClick={() => revokeInvite(invite.id)}
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
