'use client'
// components/EditTaskModal.tsx
// Bottom-sheet modal for editing a task's name, icon, freq, and meta.

import { useState, useEffect } from 'react'
import type { TaskWithSubtasks } from '@/lib/supabase/types'

const FREQ_OPTIONS = ['Daily', 'Weekdays', 'Weekly', 'Bi-weekly', 'Monthly', 'As needed']

const EMOJI_OPTIONS = [
  '📋','🧹','🧺','🛒','🍳','🌱','🐶','🚗','💊','📦',
  '🏠','💡','🔧','🧼','🛁','📚','💪','🎯','🎉','❤️',
]

interface EditTaskModalProps {
  task:    TaskWithSubtasks | null   // null = closed
  onSave:  (taskId: string, updates: { name: string; icon: string; freq: string; meta: string }) => void
  onClose: () => void
}

export function EditTaskModal({ task, onSave, onClose }: EditTaskModalProps) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📋')
  const [freq, setFreq] = useState('Weekly')
  const [meta, setMeta] = useState('')

  // Sync fields when task changes
  useEffect(() => {
    if (task) {
      setName(task.name)
      setIcon(task.icon || '📋')
      setFreq(task.freq || 'Weekly')
      setMeta(task.meta || '')
    }
  }, [task])

  if (!task) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !task) return
    onSave(task.id, { name: name.trim(), icon, freq, meta: meta.trim() })
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} aria-hidden />

      {/* Sheet */}
      <div className="modal-sheet" role="dialog" aria-label="Edit task">
        <div className="modal-handle" />
        <div className="modal-header">
          <div className="modal-title">Edit task</div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">

          {/* Icon picker */}
          <div className="modal-field">
            <label className="modal-label">Icon</label>
            <div className="emoji-grid">
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e}
                  type="button"
                  className={`emoji-btn${icon === e ? ' active' : ''}`}
                  onClick={() => setIcon(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="modal-field">
            <label className="modal-label">Task name</label>
            <input
              className="modal-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Take out bins"
              required
              autoFocus
            />
          </div>

          {/* Meta / note */}
          <div className="modal-field">
            <label className="modal-label">Note <span className="modal-label-hint">(optional)</span></label>
            <input
              className="modal-input"
              value={meta}
              onChange={e => setMeta(e.target.value)}
              placeholder="e.g. Check expiry dates"
            />
          </div>

          {/* Frequency */}
          <div className="modal-field">
            <label className="modal-label">Frequency</label>
            <div className="freq-pill-row">
              {FREQ_OPTIONS.map(f => (
                <button
                  key={f}
                  type="button"
                  className={`freq-pill${freq === f ? ' active' : ''}`}
                  onClick={() => setFreq(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <button className="modal-save-btn" type="submit" disabled={!name.trim()}>
            Save changes
          </button>
        </form>
      </div>
    </>
  )
}
