'use client'
// lib/hooks/useTasks.ts
// Fetches tasks + subtasks for a column and subscribes to realtime changes.
//
// ownerId:
//   null        → loading / not ready, skip fetch
//   'together'  → fetch is_shared tasks (the "Together" column)
//   <uuid>      → fetch tasks owned by that profile

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient }                             from '@/lib/supabase/client'
import type { TaskWithSubtasks, Subtask, OwnerFilter } from '@/lib/supabase/types'

interface UseTasksReturn {
  tasks:         TaskWithSubtasks[]
  loading:       boolean
  error:         string | null
  addTask:       (name: string, icon?: string, freq?: string, meta?: string) => Promise<void>
  deleteTask:    (taskId: string) => Promise<void>
  checkSubtask:  (subtaskId: string, checked: boolean) => Promise<void>
  addSubtask:    (taskId: string, text: string) => Promise<void>
  editSubtask:   (subtaskId: string, text: string) => Promise<void>
  deleteSubtask: (subtaskId: string) => Promise<void>
}

export function useTasks(ownerId: OwnerFilter): UseTasksReturn {
  const [tasks,   setTasks]   = useState<TaskWithSubtasks[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const supabase              = createClient()
  const profileRef            = useRef<{ id: string; household_id: string } | null>(null)

  // ── Load current user's profile once ─────────────────────────
  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('profiles')
      .select('id, household_id')
      .eq('id', user.id)
      .single()
    const profile = data as unknown as { id: string; household_id: string } | null
    profileRef.current = profile
    return profile
  }, [supabase])

  // ── Fetch tasks + subtasks ────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    if (ownerId === null) { setLoading(false); return }

    const profile = profileRef.current ?? await loadProfile()
    if (!profile) { setLoading(false); return }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('tasks')
      .select('*, subtasks (*)')
      .eq('household_id', profile.household_id)
      .order('position', { ascending: true })

    if (ownerId === 'together') {
      query = query.eq('is_shared', true)
    } else {
      query = query.eq('owner_id', ownerId)
    }

    const { data, error } = await query

    if (error) { setError(error.message); setLoading(false); return }

    const rows = (data ?? []) as TaskWithSubtasks[]
    const sorted = rows.map(task => ({
      ...task,
      subtasks: [...task.subtasks].sort((a, b) => a.position - b.position),
    }))

    setTasks(sorted)
    setLoading(false)
  }, [supabase, ownerId, loadProfile])

  // ── Realtime subscriptions ────────────────────────────────────
  useEffect(() => {
    let mounted = true

    const init = async () => {
      await loadProfile()
      if (mounted) await fetchTasks()
    }
    init()

    const chanKey = ownerId ?? 'null'

    const subtaskChannel = supabase
      .channel(`subtasks-${chanKey}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subtasks' }, (payload) => {
        if (!mounted) return

        if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(task => ({
            ...task,
            subtasks: task.subtasks.map(st =>
              st.id === (payload.new as Subtask).id
                ? { ...st, ...(payload.new as Subtask) }
                : st
            ),
          })))
        }
        if (payload.eventType === 'INSERT') {
          const newSt = payload.new as Subtask
          setTasks(prev => prev.map(task =>
            task.id === newSt.task_id
              ? { ...task, subtasks: [...task.subtasks, newSt].sort((a, b) => a.position - b.position) }
              : task
          ))
        }
        if (payload.eventType === 'DELETE') {
          const deleted = payload.old as Subtask
          setTasks(prev => prev.map(task => ({
            ...task,
            subtasks: task.subtasks.filter(st => st.id !== deleted.id),
          })))
        }
      })
      .subscribe()

    const taskChannel = supabase
      .channel(`tasks-${chanKey}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        if (mounted) fetchTasks()
      })
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(subtaskChannel)
      supabase.removeChannel(taskChannel)
    }
  }, [supabase, fetchTasks, loadProfile, ownerId])

  // ── Task actions ──────────────────────────────────────────────
  const addTask = useCallback(async (
    name: string,
    icon  = '📋',
    freq  = 'Weekly',
    meta  = '',
  ) => {
    if (ownerId === null) return
    const profile = profileRef.current ?? await loadProfile()
    if (!profile) return

    // Find the highest position in this column
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let posQuery = (supabase as any)
      .from('tasks')
      .select('position')
      .eq('household_id', profile.household_id)

    if (ownerId === 'together') {
      posQuery = posQuery.eq('is_shared', true)
    } else {
      posQuery = posQuery.eq('owner_id', ownerId)
    }

    const { data: rawPos } = await posQuery.order('position', { ascending: false }).limit(1)
    const pos = (rawPos as unknown as { position: number }[] | null)
    const nextPos = (pos?.[0]?.position ?? 0) + 1

    const taskData = ownerId === 'together'
      ? { household_id: profile.household_id, is_shared: true,  owner_id: null,   name, icon, freq, meta, position: nextPos }
      : { household_id: profile.household_id, is_shared: false, owner_id: ownerId, name, icon, freq, meta, position: nextPos }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('tasks') as any).insert(taskData)
  }, [supabase, ownerId, loadProfile])

  const deleteTask = useCallback(async (taskId: string) => {
    await supabase.from('tasks').delete().eq('id', taskId)
  }, [supabase])

  // ── Subtask actions ───────────────────────────────────────────
  const checkSubtask = useCallback(async (subtaskId: string, checked: boolean) => {
    const profile = profileRef.current
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('subtasks') as any)
      .update({
        checked,
        checked_by: checked ? (profile?.id ?? null) : null,
        checked_at: checked ? new Date().toISOString() : null,
      })
      .eq('id', subtaskId)
  }, [supabase])

  const addSubtask = useCallback(async (taskId: string, text: string) => {
    const profile = profileRef.current
    if (!profile) return

    const { data: rawPos } = await supabase
      .from('subtasks')
      .select('position')
      .eq('task_id', taskId)
      .order('position', { ascending: false })
      .limit(1)

    const stPos   = rawPos as unknown as { position: number }[] | null
    const nextPos = (stPos?.[0]?.position ?? 0) + 1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('subtasks') as any).insert({
      task_id:      taskId,
      household_id: profile.household_id,
      text,
      position:     nextPos,
    })
  }, [supabase])

  const editSubtask = useCallback(async (subtaskId: string, text: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('subtasks') as any).update({ text }).eq('id', subtaskId)
  }, [supabase])

  const deleteSubtask = useCallback(async (subtaskId: string) => {
    await supabase.from('subtasks').delete().eq('id', subtaskId)
  }, [supabase])

  return { tasks, loading, error, addTask, deleteTask, checkSubtask, addSubtask, editSubtask, deleteSubtask }
}
