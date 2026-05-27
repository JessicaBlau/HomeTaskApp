'use client'
// components/NotifPanel.tsx
// Slide-in reminder / notification drawer

interface NotifPanelProps {
  open:    boolean
  onClose: () => void
}

export function NotifPanel({ open, onClose }: NotifPanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`notif-backdrop${open ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <aside
        className={`notif-drawer${open ? ' open' : ''}`}
        aria-label="Reminders"
        aria-hidden={!open}
      >
        <div className="notif-header">
          <div className="notif-title">Reminders</div>
          <button
            className="notif-close"
            onClick={onClose}
            aria-label="Close reminders"
          >
            ✕
          </button>
        </div>

        <div className="notif-list">
          <div className="notif-empty">
            <div className="notif-empty-icon">🔔</div>
            <div className="notif-empty-text">No reminders yet</div>
            <div className="notif-empty-sub">
              Reminders for recurring tasks will show up here.
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
