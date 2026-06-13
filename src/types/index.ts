import type { User } from '@supabase/supabase-js'

// ============================================================
// Profile
// ============================================================

/**
 * Represents a row in the `public.profiles` table.
 * Created automatically via the `on_auth_user_created` DB trigger.
 */
export interface Profile {
  id: string
  full_name: string | null
  email: string
  created_at: string
  updated_at: string
}

// ============================================================
// Auth
// ============================================================

/** Authenticated session data returned from Supabase */
export type AuthUser = User

/** State returned by auth Server Actions (signup / login) */
export type AuthActionState =
  | {
      success: true
      message: string
    }
  | {
      success: false
      message?: string
      errors?: {
        full_name?: string[]
        email?: string[]
        password?: string[]
      }
    }
  | undefined

// ============================================================
// Zod-validated input shapes (used in Server Actions)
// ============================================================

export interface SignUpInput {
  full_name: string
  email: string
  password: string
}

export interface SignInInput {
  email: string
  password: string
}

// ============================================================
// Carbon / Ecosystem types — stubbed for Phase 2+
// ============================================================

export interface DailyEntry {
  id: string
  user_id: string
  date: string
  transport_type: string | null
  transport_distance_km: number | null
  food_type: string | null
  energy_usage_kwh: number | null
  shopping_items: number | null
  carbon_score: number
  created_at: string
  updated_at: string
}

export interface EcosystemState {
  id: string
  user_id: string
  forest_health: number
  water_quality: number
  air_quality: number
  biodiversity: number
  created_at: string
  updated_at: string
}

export interface Insight {
  id: string
  user_id: string
  insight_type: string
  generated_for_date: string
  content: string
  metadata: Record<string, unknown> | null
  is_read: boolean
  created_at: string
}
