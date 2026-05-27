'use client'
// components/TaskCard.tsx
// Expandable card — task header + collapsible subtask panel.
// Uses a `color` hex prop for accents (border, freq tag) instead of owner-name CSS classes.

import { useState }        from 'react'
import { SubtaskItem }     from '@/components/SubtaskItem'
import { AddRow }          from '@/components/AddRow'
import type { TaskWithSubtasks } from '@/lib/supabase/types'

interface TaskCardProps {
  task:          TaskWithSubtasks
  color:         string              // hex from profile or '#6A9060' for together
  profiles:      Record<string, string>
  currentUserId: string
  onCheck:       (id: string, checked: boolean) => void
  onAdd:         (taskId: string, text: string) => void
  onEdit:        (id: string, text: string) => void
  onDelete:      (id: string) => void
}

/** Light tint: color at ~12% opacity for freq tag background */
function tint(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},0.12)`
}

export function TaskCard({
  task, color, profiles, currentUserId,
  onCheck, onAdd, onEdit, onDelete,
}: TaskCardProps) {
  const [open, setOpen] = useState(false)

  const done  = task.subtasks.filter(s => s.checked).length
  const total = task.subtasks.length

  return (
    <div
      className="task-card"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      {/* ── Header ── */}
      <div
        className="task-header"
        onClick={() => setOpen(o => !o)}
        role="button"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}
      >
        <span className="task-emoji">{task.icon || '📋'}</span>

        <div className="task-info">
          <div className="task-name">{task.name}</div>
          {task.meta && <div className="task-meta">{task.meta}</div>}
        </div>

        <div className="task-right">
          {task.freq && (
            <span
              className="freq-tag"
              style={{ background: tint(color), color }}
            >
              {task.freq}
            </span>
          )}
          {total > 0 && (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              color: done === total ? color : 'var(--ink-faint)',
            }}>
              {done}/{total}
            </span>
          )}
          <span className={`chevron${open ? ' open' : ''}`}>▾</span>
        </div>
      </div>

      {/* ── Subtask panel ── */}
      <div className={`subtask-panel${open ? ' open' : ''}`}>
        <div className="subtask-list">
          {task.subtasks.map(st => (
            <SubtaskItem
              key={st.id}
              subtask={st}
              color={color}
              profiles={profiles}
              currentUserId={currentUserId}
              onCheck={onCheck}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
          <AddRow taskId={task.id} color={color} onAdd={onAdd} />
        </div>
      </div>
    </div>
  )
}
