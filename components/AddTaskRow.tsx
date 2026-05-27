'use client'
// components/AddTaskRow.tsx
// Collapsed "Add task" row that expands into a small form.
// Lives at the bottom of each column.

import { useState, useRef } from 'react'

interface AddTaskRowProps {
  onAdd: (name: string, icon: string, freq: string) => void
}

const FREQ_OPTIONS = ['Daily', 'Weekly', 'Monthly', 'As needed']

export function AddTaskRow({ onAdd }: AddTaskRowProps) {
  const [open,  setOpen]  = useState(false)
  const [name,  setName]  = useState('')
  const [icon,  setIcon]  = useState('📋')
  const [freq,  setFreq]  = useState('Weekly')
  const nameRef           = useRef<HTMLInputElement>(null)

  function openForm() {
    setOpen(true)
    setTimeout(() => nameRef.current?.focus(), 0)
  }

  function reset() {
    setName('')
    setIcon('📋')
    setFreq('Weekly')
    setOpen(false)
  }

  function submit() {
    const trimmed = name.trim()
    if (trimmed) {
      onAdd(trimmed, icon.trim() || '📋', freq)
      reset()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter')  submit()
    if (e.key === 'Escape') reset()
  }

  if (!open) {
    return (
      <div
        className="add-task-row"
        onClick={openForm}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && openForm()}
      >
        <div className="add-task-plus">+</div>
        <span className="add-task-label">Add task</span>
      </div>
    )
  }

  return (
    <div className="add-task-form">
      {/* Emoji + name row */}
      <div className="add-task-inputs">
        <input
          className="add-task-icon-input"
          value={icon}
          onChange={e => setIcon(e.target.value)}
          maxLength={4}
          aria-label="Task icon (emoji)"
        />
        <input
          ref={nameRef}
          className="add-task-name-input"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Task name…"
          aria-label="Task name"
        />
      </div>

      {/* Freq + actions row */}
      <div className="add-task-actions">
        <select
          className="add-task-freq"
          value={freq}
          onChange={e => setFreq(e.target.value)}
          aria-label="Frequency"
        >
          {FREQ_OPTIONS.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <div className="add-task-btns">
          <button
            className="add-task-cancel"
            onClick={reset}
            type="button"
            aria-label="Cancel"
          >
            Cancel
          </button>
          <button
            className="add-task-submit"
            onClick={submit}
            type="button"
            aria-label="Add task"
            disabled={!name.trim()}
          >
            Add task
          </button>
        </div>
      </div>
    </div>
  )
}
