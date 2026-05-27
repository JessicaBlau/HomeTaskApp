'use client'
// components/Toast.tsx
// Exports: ToastProvider, useToast, SyncIndicator, OverviewStrip, LoadingScreen, ReminderToasts

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react'
// (Owner type removed — col is now a plain string slug)

// ─── Toast context ────────────────────────────────────────────────────

interface ToastMsg {
  id:   number
  text: string
}

interface ToastContextValue {
  showToast: (text: string) => void
}

const ToastCtx = createContext<ToastContextValue>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastCtx)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const counterRef          = useRef(0)

  const showToast = useCallback((text: string) => {
    const id = ++counterRef.current
    setToasts(prev => [...prev, { id, text }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 2800)
  }, [])

  return (
    <ToastCtx.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map(t => (
          <div key={t.id} className="toast">{t.text}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

// ─── SyncIndicator ────────────────────────────────────────────────────

type SyncStatus = 'synced' | 'syncing' | 'loading'

const SYNC_LABELS: Record<SyncStatus, string> = {
  synced:  'Synced',
  syncing: 'Syncing…',
  loading: 'Loading…',
}

export function SyncIndicator({ status }: { status: SyncStatus }) {
  const pulse = status === 'syncing' || status === 'loading'

  return (
    <div className={`sync-indicator ${status}`} aria-label={SYNC_LABELS[status]}>
      <div className={`sync-dot${pulse ? ' pulse' : ''}`} />
      <span>{SYNC_LABELS[status]}</span>
    </div>
  )
}

// ─── OverviewStrip ────────────────────────────────────────────────────

interface OverviewStripProps {
  col:    string    // owner URL slug (for aria/key use)
  color?: string    // hex accent — defaults to ink-muted
  total:  number
  done:   number
}

export function OverviewStrip({ col: _col, color, total, done }: OverviewStripProps) {
  const remaining = total - done
  const pct       = total ? Math.round((done / total) * 100) : 0
  const accent    = color ?? 'var(--ink-muted)'

  return (
    <div className="overview-strip">
      <div className="ov-cell">
        <div className="ov-num" style={{ color: accent }}>{done}</div>
        <div className="ov-label">Done</div>
      </div>
      <div className="ov-cell">
        <div className="ov-num">{remaining}</div>
        <div className="ov-label">Left</div>
      </div>
      <div className="ov-cell">
        <div className="ov-num" style={{ color: accent }}>{pct}%</div>
        <div className="ov-label">Progress</div>
      </div>
    </div>
  )
}

// ─── LoadingScreen ────────────────────────────────────────────────────

export function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="spinner" />
      <div className="loading-title">Loading…</div>
      <div className="loading-sub">Fetching tasks</div>
    </div>
  )
}

// ─── ReminderToasts ───────────────────────────────────────────────────
// No-op for now — will fire dynamic reminders based on task schedules.
// Extend with Web Push for real alerts when reminder data is in the DB.

export function ReminderToasts() {
  return null
}
