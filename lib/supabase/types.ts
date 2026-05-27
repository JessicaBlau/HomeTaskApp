// lib/supabase/types.ts
// Auto-generate the full version with:
// npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id:           string
          name:         string
          invite_code:  string
          plan:         string
          created_by:   string | null
          created_at:   string
        }
        Insert: {
          id?:          string
          name:         string
          invite_code?: string
          plan?:        string
          created_by?:  string | null
          created_at?:  string
        }
        Update: {
          id?:          string
          name?:        string
          invite_code?: string
          plan?:        string
          created_by?:  string | null
          created_at?:  string
        }
      }
      profiles: {
        Row: {
          id:            string
          household_id:  string
          name:          string
          color:         string
          role:          'adult' | 'child'
          avatar_emoji:  string
          created_at:    string
        }
        Insert: {
          id:            string
          household_id:  string
          name:          string
          color?:        string
          role?:         'adult' | 'child'
          avatar_emoji?: string
          created_at?:   string
        }
        Update: {
          id?:           string
          household_id?: string
          name?:         string
          color?:        string
          role?:         'adult' | 'child'
          avatar_emoji?: string
          created_at?:   string
        }
      }
      household_invites: {
        Row: {
          id:            string
          household_id:  string
          code:          string
          created_by:    string
          role:          'adult' | 'child'
          max_uses:      number
          use_count:     number
          expires_at:    string | null
          created_at:    string
        }
        Insert: {
          id?:           string
          household_id:  string
          code?:         string
          created_by:    string
          role?:         'adult' | 'child'
          max_uses?:     number
          use_count?:    number
          expires_at?:   string | null
          created_at?:   string
        }
        Update: {
          id?:           string
          household_id?: string
          code?:         string
          created_by?:   string
          role?:         'adult' | 'child'
          max_uses?:     number
          use_count?:    number
          expires_at?:   string | null
          created_at?:   string
        }
      }
      tasks: {
        Row: {
          id:            string
          household_id:  string
          owner_id:      string | null   // null when is_shared = true
          is_shared:     boolean
          icon:          string
          name:          string
          meta:          string
          freq:          string
          position:      number
          created_at:    string
        }
        Insert: {
          id?:           string
          household_id:  string
          owner_id?:     string | null
          is_shared?:    boolean
          icon?:         string
          name:          string
          meta?:         string
          freq?:         string
          position?:     number
          created_at?:   string
        }
        Update: {
          id?:           string
          household_id?: string
          owner_id?:     string | null
          is_shared?:    boolean
          icon?:         string
          name?:         string
          meta?:         string
          freq?:         string
          position?:     number
          created_at?:   string
        }
      }
      subtasks: {
        Row: {
          id:            string
          task_id:       string
          household_id:  string
          text:          string
          checked:       boolean
          checked_by:    string | null
          checked_at:    string | null
          position:      number
          created_at:    string
        }
        Insert: {
          id?:           string
          task_id:       string
          household_id:  string
          text:          string
          checked?:      boolean
          checked_by?:   string | null
          checked_at?:   string | null
          position?:     number
          created_at?:   string
        }
        Update: {
          id?:           string
          task_id?:      string
          household_id?: string
          text?:         string
          checked?:      boolean
          checked_by?:   string | null
          checked_at?:   string | null
          position?:     number
          created_at?:   string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      my_household_id:         { Args: Record<PropertyKey, never>; Returns: string }
      my_profile_id:           { Args: Record<PropertyKey, never>; Returns: string }
      my_profile_role:         { Args: Record<PropertyKey, never>; Returns: string }
      generate_invite_code:    { Args: Record<PropertyKey, never>; Returns: string }
      get_household_for_invite: {
        Args: { p_code: string }
        Returns: {
          household_id:   string
          household_name: string
          invite_role:    string
          invite_id:      string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ─── Convenience types ─────────────────────────────────────────────
export type Household        = Database['public']['Tables']['households']['Row']
export type Profile          = Database['public']['Tables']['profiles']['Row']
export type HouseholdInvite  = Database['public']['Tables']['household_invites']['Row']
export type Task             = Database['public']['Tables']['tasks']['Row']
export type Subtask          = Database['public']['Tables']['subtasks']['Row']
export type TaskWithSubtasks = Task & { subtasks: Subtask[] }

// 'together' = shared tasks; a UUID string = profile-owned tasks
export type OwnerFilter = string | 'together' | null
