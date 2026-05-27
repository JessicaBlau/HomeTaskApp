'use client'
// app/(app)/layout.tsx
// Authenticated shell — topbar, bottom nav, notifications, toasts.

import { useState }                                  from 'react'
import { useRouter }                                 from 'next/navigation'
import { BottomNav }                                 from '@/components/BottomNav'
import { NotifPanel }                                from '@/components/NotifPanel'
import { ToastProvider, ReminderToasts, SyncIndicator } from '@/components/Toast'
import { useCurrentProfile }                         from '@/lib/hooks/useCurrentProfile'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [notifOpen, setNotifOpen]  = useState(false)
  const router                     = useRouter()
  const { household, loading }     = useCurrentProfile()

  const householdName = loading ? '' : (household?.name ?? 'Home Team')

  return (
    <ToastProvider>
      <div className="app-shell">

        {/* ── Top bar ── */}
        <header className="topbar">
          <div className="topbar-brand">
            <div className="topbar-title">🏡 {householdName}</div>
            <div className="topbar-sub">Home Team</div>
            <SyncIndicator status="synced" />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="bell-btn"
              onClick={() => router.push('/settings')}
              aria-label="Settings"
            >
              ⚙️
            </button>
            <button
              className="bell-btn"
              onClick={() => setNotifOpen(true)}
              aria-label="Open reminders"
            >
              🔔
              <span className="bell-badge" />
            </button>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="page-content">
          {children}
        </main>

        {/* ── Bottom nav ── */}
        <BottomNav />

        {/* ── Notification drawer ── */}
        <NotifPanel open={notifOpen} onClose={() => setNotifOpen(false)} />

        {/* ── Background reminder toasts ── */}
        <ReminderToasts />

      </div>
    </ToastProvider>
  )
}
