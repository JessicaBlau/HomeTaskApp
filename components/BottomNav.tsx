'use client'
// components/BottomNav.tsx
// Sliding-pill bottom navigation — built dynamically from household profiles.

import { useRouter, usePathname } from 'next/navigation'
import { useRef, useEffect, useState } from 'react'
import { useProfiles } from '@/lib/hooks/useProfiles'

interface Tab {
  key:   string
  label: string
  icon:  string
  href:  string
  color: string | null
}

const TOGETHER_TAB: Tab = {
  key: 'together', label: 'Together', icon: '🤝',
  href: '/together', color: '#6A9060',
}
const SCHEDULE_TAB: Tab = {
  key: 'schedule', label: 'Schedule', icon: '📅',
  href: '/schedule', color: null,
}

/** Make a light tint from a hex color for the nav pill background. */
function tint(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},0.14)`
}

export function BottomNav() {
  const router              = useRouter()
  const pathname            = usePathname()
  const navRef              = useRef<HTMLDivElement>(null)
  const { profiles, loading } = useProfiles()

  // Build tabs: member columns + together + schedule
  const tabs: Tab[] = [
    ...profiles.map(p => ({
      key:   p.name.toLowerCase(),
      label: p.name,
      icon:  '',
      href:  `/${p.name.toLowerCase()}`,
      color: p.color,
    })),
    TOGETHER_TAB,
    SCHEDULE_TAB,
  ]

  // Derive active tab from current path
  const activeTab = tabs.find(t => pathname.startsWith(t.href)) ?? tabs[0]
  const active    = activeTab?.key ?? ''

  // Animate sliding pill
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 })

  useEffect(() => {
    if (!navRef.current || loading) return
    const buttons = navRef.current.querySelectorAll<HTMLButtonElement>('.nav-btn')
    const idx     = tabs.findIndex(t => t.key === active)
    const btn     = buttons[idx]
    if (!btn) return

    const parentRect = navRef.current.getBoundingClientRect()
    const btnRect    = btn.getBoundingClientRect()

    setPillStyle({
      left:  btnRect.left - parentRect.left,
      width: btnRect.width,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, loading, tabs.length])

  if (loading) return null

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <div className="nav-items" ref={navRef}>
        {/* Sliding pill */}
        <div
          className="nav-pill"
          style={{
            left:            pillStyle.left,
            width:           pillStyle.width,
            backgroundColor: activeTab?.color ? tint(activeTab.color) : 'var(--surface-2)',
          }}
          aria-hidden
        />

        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`nav-btn${active === tab.key ? ' active' : ''}`}
            onClick={() => router.push(tab.href)}
            aria-label={tab.label}
            aria-current={active === tab.key ? 'page' : undefined}
            style={active === tab.key && tab.color
              ? { color: tab.color }
              : undefined
            }
          >
            {tab.icon && <span className="nav-icon">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
