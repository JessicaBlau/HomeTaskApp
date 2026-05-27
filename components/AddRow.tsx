'use client'
// components/AddRow.tsx
// Inline "add subtask" row inside a task card.
// Uses a `color` hex prop for focus accent instead of owner-name CSS classes.

import { useState, useRef } from 'react'

interface AddRowProps {
  taskId: string
  color:  string     // hex accent from profile
  onAdd:  (taskId: string, text: string) => void
}

export function AddRow({ taskId, color, onAdd }: AddRowProps) {
  const [open,  setOpen]  = useState(false)
  const [value, setValue] = useState('')
  const inputRef          = useRef<HTMLInputElement>(null)

  function openInput() {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function submit() {
    const text = value.trim()
    if (text) {
      onAdd(taskId, text)
      setValue('')
    }
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter')  submit()
    if (e.key === 'Escape') { setOpen(false); setValue('') }
  }

  if (open) {
    return (
      <div className="add-row">
        <div className="add-plus">+</div>
        <input
          ref={inputRef}
          className="inline-input"
          style={{ '--focus-color': color } as React.CSSProperties}
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={submit}
          onKeyDown={handleKeyDown}
          placeholder="Add subtask…"
        />
      </div>
    )
  }

  return (
    <div
      className="add-row"
      onClick={openInput}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && openInput()}
    >
      <div className="add-plus">+</div>
      <span className="add-label">Add subtask</span>
    </div>
  )
}
