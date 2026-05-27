'use client'
// components/ColPage.tsx
// Shared column view — resolves URL slug → profile ID → tasks.

import { useEffect, useState }          from 'react'
import { useTasks }                     from '@/lib/hooks/useTasks'
import { useProfiles }                  from '@/lib/hooks/useProfiles'
import { useCurrentProfile }            from '@/lib/hooks/useCurrentProfile'
import { TaskCard }                     from '@/components/TaskCard'
import { AddTaskRow }                   from '@/components/AddTaskRow'
import { ArcProgress }                  from '@/components/ArcProgress'
import { OverviewStrip, LoadingScreen } from '@/components/Toast'
import { useToast }                     from '@/components/Toast'
import type { Profile, OwnerFilter }    from '@/lib/supabase/types'

// ── Derive header meta from owner slug + profile list ─────────
function ownerMeta(owner: string, profileList: Profile[]) {
  if (owner === 'together') {
    return { icon: '🤝', label: 'Together', sub: 'Shared tasks', color: '#6A9060' }
  }
  const profile = profileList.find(
    p => p.name.toLowerCase() === owner.toLowerCase()
  )
  const label = profile?.name ?? (owner.charAt(0).toUpperCase() + owner.slice(1))
  return {
    icon:  label.charAt(0).toUpperCase(),
    label,
    sub:   'Responsibilities',
    color: profile?.color ?? '#8C7B6E',
  }
}

export function ColPage({ owner }: { owner: string }) {
  const { profiles: profileList, loading: profilesLoading } = useProfiles()
  const { profile: currentProfile }                         = useCurrentProfile()

  // Resolve URL slug → owner ID for the hook
  const ownerProfile = owner === 'together'
    ? null
    : profileList.find(p => p.name.toLowerCase() === owner.toLowerCase())

  const ownerId: OwnerFilter = owner === 'together'
    ? 'together'
    : (profilesLoading ? null : (ownerProfile?.id ?? null))

  const {
    tasks, loading,
    addTask, checkSubtask, addSubtask, editSubtask, deleteSubtask,
  } = useTasks(ownerId)

  const { showToast }                     = useToast()
  const [profileMap, setProfileMap]       = useState<Record<string, string>>({})
  const isAdult                           = currentProfile?.role === 'adult'
  const meta                              = ownerMeta(owner, profileList)

  // Build id→name map for subtask attribution display
  useEffect(() => {
    const map: Record<string, string> = {}
    profileList.forEach(p => { map[p.id] = p.name })
    setProfileMap(map)
  }, [profileList])

  const total = tasks.reduce((acc, t) => acc + t.subtasks.length, 0)
  const done  = tasks.reduce((acc, t) => acc + t.subtasks.filter(s => s.checked).length, 0)
  const pct   = total ? Math.round((done / total) * 100) : 0

  if (loading || profilesLoading) return <LoadingScreen />

  return (
    <>
      {/* Stats strip */}
      <OverviewStrip col={owner} color={meta.color} total={total} done={done} />

      {/* Section header */}
      <div className="section-header" style={{ background: meta.color }}>
        <div className="sec-icon">{meta.icon}</div>
        <div className="sec-text">
          <div className="sec-title">{meta.label}</div>
          <div className="sec-subtitle">{meta.sub}</div>
        </div>
        <div className="arc-wrap">
          <ArcProgress pct={pct} size={48} color="white" />
          <div className="arc-label">{done} / {total}</div>
        </div>
      </div>

      {/* Task cards */}
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          color={ownerProfile?.color ?? meta.color}
          profiles={profileMap}
          currentUserId={currentProfile?.id ?? ''}
          onCheck={(id, checked) => {
            checkSubtask(id, checked)
            showToast(checked ? '✅ Done!' : '↩️ Unchecked')
          }}
          onAdd={(taskId, text) => {
            addSubtask(taskId, text)
            showToast('✨ Subtask added')
          }}
          onEdit={(id, text) => {
            editSubtask(id, text)
            showToast('✏️ Saved')
          }}
          onDelete={(id) => {
            deleteSubtask(id)
            showToast('🗑️ Removed')
          }}
        />
      ))}

      {tasks.length === 0 && (
        <div style={{
          textAlign:  'center',
          padding:    'var(--space-10) var(--space-6)',
          color:      'var(--ink-faint)',
          fontFamily: 'var(--font-serif)',
          fontStyle:  'italic',
          fontSize:   '1rem',
        }}>
          No tasks yet — add your first one below!
        </div>
      )}

      {/* Add task row — adults only */}
      {isAdult && (
        <AddTaskRow
          onAdd={(name, icon, freq) => {
            addTask(name, icon, freq)
            showToast('✨ Task added!')
          }}
        />
      )}
    </>
  )
}
