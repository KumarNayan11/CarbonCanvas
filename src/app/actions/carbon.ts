'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { calculateTotalCarbon } from '@/services/carbon-calculator'
import { calculateEcosystemState } from '@/services/ecosystem-engine'
import type { TransportType, FoodType } from '@/services/carbon-calculator'

// ============================================================
// Types
// ============================================================

/** Shape of a successful or failed carbon entry submission. */
export type CarbonActionState =
  | { success: true; message: string }
  | { success: false; message: string; errors?: Record<string, string[]> }
  | undefined

/**
 * The validated, typed form data required to submit a daily carbon entry.
 * All fields map directly to columns in `public.daily_entries`.
 */
export interface CarbonEntryFormData {
  /** Mode of transport — maps to `transport_type`. */
  transportType: TransportType
  /** Distance travelled in km — maps to `transport_distance_km`. */
  transportDistanceKm: number
  /** Dietary category — maps to `food_type`. */
  foodType: FoodType
  /** Energy consumed in kWh — maps to `energy_usage_kwh`. */
  energyUsageKwh: number
  /** Number of items purchased — maps to `shopping_items`. */
  shoppingItems: number
}

// ============================================================
// Validation Schema
// ============================================================

const CarbonEntrySchema = z.object({
  transportType: z.enum(['car', 'bus', 'train', 'bicycle', 'walking'], {
    message: 'Transport type must be one of: car, bus, train, bicycle, walking.',
  }),
  transportDistanceKm: z.coerce
    .number({ message: 'Distance must be a number.' })
    .min(0, { message: 'Distance cannot be negative.' })
    .max(10_000, { message: 'Distance cannot exceed 10,000 km.' }),
  foodType: z.enum(['vegetarian', 'mixed', 'meat'], {
    message: 'Food type must be one of: vegetarian, mixed, meat.',
  }),
  energyUsageKwh: z.coerce
    .number({ message: 'Energy usage must be a number.' })
    .min(0, { message: 'Energy usage cannot be negative.' })
    .max(100_000, { message: 'Energy usage cannot exceed 100,000 kWh.' }),
  shoppingItems: z.coerce
    .number({ message: 'Shopping items must be a number.' })
    .int({ message: 'Shopping items must be a whole number.' })
    .min(0, { message: 'Shopping items cannot be negative.' })
    .max(1_000, { message: 'Shopping items cannot exceed 1,000.' }),
})

// ============================================================
// Helpers
// ============================================================

/** Returns today's date as a YYYY-MM-DD string in the local server timezone. */
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

// ============================================================
// Server Action
// ============================================================

/**
 * Server Action: submits a user's daily carbon activity entry.
 *
 * Flow:
 * 1. Authenticate the current user via `getUser()`.
 * 2. Validate incoming `FormData` with Zod.
 * 3. Calculate the total carbon score using `calculateTotalCarbon()`.
 * 4. Insert (or update) a row in `public.daily_entries` for today.
 * 5. Calculate ecosystem health using `calculateEcosystemState()`.
 * 6. Upsert the user's row in `public.ecosystem_states`.
 *
 * @param _prevState - Previous action state (required by `useActionState` contract).
 * @param formData - Raw form data from the client.
 * @returns {@link CarbonActionState} indicating success or failure with a message.
 */
export async function submitCarbonEntry(
  _prevState: CarbonActionState,
  formData: FormData,
): Promise<CarbonActionState> {
  // ----------------------------------------------------------
  // 1. Authenticate
  // ----------------------------------------------------------
  const supabase = await createServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      message: 'You must be signed in to submit a carbon entry.',
    }
  }

  // ----------------------------------------------------------
  // 2. Validate
  // ----------------------------------------------------------
  const rawData = {
    transportType: formData.get('transportType'),
    transportDistanceKm: formData.get('transportDistanceKm'),
    foodType: formData.get('foodType'),
    energyUsageKwh: formData.get('energyUsageKwh'),
    shoppingItems: formData.get('shoppingItems'),
  }

  const validated = CarbonEntrySchema.safeParse(rawData)

  if (!validated.success) {
    return {
      success: false,
      message: 'Please fix the errors below and try again.',
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const {
    transportType,
    transportDistanceKm,
    foodType,
    energyUsageKwh,
    shoppingItems,
  } = validated.data

  // ----------------------------------------------------------
  // 3. Calculate carbon score
  // ----------------------------------------------------------
  const carbonScore = calculateTotalCarbon({
    transportType,
    transportDistanceKm,
    foodType,
    energyUsageKwh,
    shoppingItems,
  })

  // ----------------------------------------------------------
  // 4. Upsert daily_entries (one row per user per day)
  // ----------------------------------------------------------
  const today = getTodayDateString()

  const { error: entryError } = await supabase.from('daily_entries').upsert(
    {
      user_id: user.id,
      date: today,
      transport_type: transportType,
      transport_distance_km: transportDistanceKm,
      food_type: foodType,
      energy_usage_kwh: energyUsageKwh,
      shopping_items: shoppingItems,
      carbon_score: carbonScore,
    },
    {
      // The schema has a UNIQUE(user_id, date) constraint — upsert on conflict.
      onConflict: 'user_id,date',
    },
  )

  if (entryError) {
    return {
      success: false,
      message: 'Failed to save your daily entry. Please try again later.',
    }
  }

  // ----------------------------------------------------------
  // 5. Calculate ecosystem state
  // ----------------------------------------------------------
  const { forestHealth, waterQuality, airQuality, biodiversity } =
    calculateEcosystemState(carbonScore)

  // ----------------------------------------------------------
  // 6. Append ecosystem_states snapshot — INSERT is intentional
  //
  // ⚠️  DO NOT change this to an UPSERT. See docs/architecture.md § ADR-001.
  //
  // `ecosystem_states` has NO UNIQUE(user_id) constraint by design.
  // It is an append-only, time-series table. Every carbon entry produces
  // a new snapshot row so the full history of ecosystem health is preserved
  // for trend charts, AI-generated reflections, and behaviour-change tracking.
  //
  // To retrieve the *current* state elsewhere in the app, query the most
  // recent snapshot:
  //
  //   supabase
  //     .from('ecosystem_states')
  //     .select('*')
  //     .eq('user_id', userId)
  //     .order('created_at', { ascending: false })
  //     .limit(1)
  //     .single()
  // ----------------------------------------------------------
  const { error: ecosystemError } = await supabase
    .from('ecosystem_states')
    .insert({
      user_id: user.id,
      forest_health: forestHealth,
      water_quality: waterQuality,
      air_quality: airQuality,
      biodiversity: biodiversity,
    })

  if (ecosystemError) {
    return {
      success: false,
      message: 'Failed to update your ecosystem. Please try again later.',
    }
  }

  revalidatePath('/dashboard')

  return {
    success: true,
    message: `Your carbon footprint for today (${carbonScore} kg CO₂e) has been recorded.`,
  }
}
