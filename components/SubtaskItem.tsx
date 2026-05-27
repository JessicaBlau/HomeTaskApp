'use client'
// components/SubtaskItem.tsx
// A single subtask row — checkbox, label, edit/delete actions.
// Uses a `color` hex prop for accent styles instead of owner-name CSS classes.

import { useState, useRef } from 'react'
import type { Subtask }     from '@/lib/supabase/types'

interface SubtaskItemProps {
  subtask:       Subtask
  color:         string               // hex accent from profile
  profiles:      Record<string, string>
  currentUserId: string
  onCheck:       (id: string, checked: boolean) => void
  onEdit:        (id: string, text: string) => void
  onDelete:      (id: string) => void
}

export function SubtaskItem({
  subtask, color, profiles, onCheck, onEdit, onDelete,
}: SubtaskItemProps) {
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(subtask.text)
  const inputRef              = useRef<HTMLInputElement>(null)

  function startEdit() {
    setEditVal(subtask.text)
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function commitEdit() {
    const text = editVal.trim()
    if (text && text !== subtask.text) onEdit(subtask.id, text)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter')  commitEdit()
    if (e.key === 'Escape') { setEditing(false); setEditVal(subtask.text) }
  }

  const checkerName = subtask.checked_by ? (profiles[subtask.checked_by] ?? '') : ''

  return (
    <div className="subtask-item" onClick={() => !editing && onCheck(subtask.id, !subtask.checked)}>

      {/* Checkbox — filled with profile color when checked */}
      <div
        className={`subtask-cb${subtask.checked ? ' checked' : ''}`}
        style={subtask.checked ? { background: color, borderColor: color } : undefined}
      >
        <span className={`check-mark${subtask.checked ? ' visible' : ''}`}>✓</span>
      </div>

      {/* Label / edit input */}
      {editing ? (
        <input
          ref={inputRef}
          className="inline-input"
          style={{ '--focus-color': color } as React.CSSProperties}
          value={editVal}
          onChange={e => setEditVal(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span className={`subtask-label${subtask.checked ? ' checked' : ''}`}>
          {subtask.text}
        </span>
      )}

      {/* "Name ✓" attribution */}
      {subtask.checked && checkerName && !editing && (
        <span className="checked-by">{checkerName} ✓</span>
      )}

      {/* Edit / delete actions */}
      {!editing && (
        <div className="subtask-actions" onClick={e => e.stopPropagation()}>
          <button className="act-btn edit" title="Edit" onClick={startEdit} aria-label="Edit subtask">
            ✏️
          </button>
          <button className="act-btn del" title="Delete" onClick={() => onDelete(subtask.id)} aria-label="Delete subtask">
            🗑
          </button>
        </div>
      )}
    </div>
  )
}
