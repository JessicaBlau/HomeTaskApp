'use client'
// lib/hooks/useProfiles.ts
// Loads all profiles in the current user's household.
// Used by BottomNav and ColPage to build dynamic member tabs/headers.

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'

interface UseProfilesReturn {
  profiles: Profile[]
  loading:  boolean
}

export function useProfiles(): UseProfilesReturn {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading,  setLoading]  = useState(true)
  const supabase                = createClient()

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setProfiles(data ?? [])
        setLoading(false)
      })
  }, [supabase])

  return { profiles, loading }
}
