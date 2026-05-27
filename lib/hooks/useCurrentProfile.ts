'use client'
// lib/hooks/useCurrentProfile.ts
// Returns the logged-in user's profile and household.
// Used by components that need to know who is viewing (role, color, etc.).

import { useEffect, useState } from 'react'
import { createClient }       from '@/lib/supabase/client'
import type { Profile, Household } from '@/lib/supabase/types'

interface UseCurrentProfileReturn {
  profile:   Profile | null
  household: Household | null
  loading:   boolean
  isAdult:   boolean
  isChild:   boolean
}

export function useCurrentProfile(): UseCurrentProfileReturn {
  const [profile,   setProfile]   = useState<Profile | null>(null)
  const [household, setHousehold] = useState<Household | null>(null)
  const [loading,   setLoading]   = useState(true)
  const supabase                  = createClient()

  useEffect(() => {
    let mounted = true

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !mounted) { setLoading(false); return }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profileData || !mounted) { setLoading(false); return }
      const prof = profileData as unknown as Profile
      setProfile(prof)

      const { data: householdData } = await supabase
        .from('households')
        .select('*')
        .eq('id', prof.household_id)
        .single()

      if (mounted) {
        setHousehold((householdData as unknown as Household) ?? null)
        setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [supabase])

  return {
    profile,
    household,
    loading,
    isAdult: profile?.role === 'adult',
    isChild: profile?.role === 'child',
  }
}
