'use server'

/**
 * @file simulator.ts (Server Actions)
 * @description Server Actions for the Impact Simulator.
 *
 * Exposes narrative generation as a Server Action so the
 * SimulatorClient (a Client Component) can call it without
 * bundling the Gemini SDK into the browser.
 *
 * Design decisions:
 * - **No database writes** — narratives are ephemeral and never persisted.
 * - **Auth required** — the simulator is protected at the page level, but
 *   we verify the session here too as a defence-in-depth measure.
 * - **Never throws to the client** — errors are surfaced via the return type.
 */

import { createServerClient } from '@/lib/supabase/server'
import {
  generateSimulatorNarrative,
  type SimulatorNarrativeInput,
  type SimulatorNarrative,
} from '@/services/simulator-narrative'

// ============================================================
// Return type
// ============================================================

export type NarrativeActionResult =
  | { success: true; narrative: SimulatorNarrative }
  | { success: false; error: string }

// ============================================================
// Server Action
// ============================================================

/**
 * Server Action: generates an AI what-if narrative for a simulation result.
 *
 * Accepts the numerical inputs that describe a simulation scenario and
 * delegates to {@link generateSimulatorNarrative}. Results are **not**
 * written to any database table.
 *
 * @param input - Key metrics from the SimulationResult.
 * @returns A {@link NarrativeActionResult} containing the three-part narrative
 *          or an error message.
 */
export async function generateSimulationNarrative(
  input: SimulatorNarrativeInput,
): Promise<NarrativeActionResult> {
  // ----------------------------------------------------------
  // 1. Auth guard (defence-in-depth — page already checks this)
  // ----------------------------------------------------------
  const supabase = await createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Authentication required.' }
  }

  // ----------------------------------------------------------
  // 2. Validate input sanity (guard against malformed calls)
  // ----------------------------------------------------------
  if (
    typeof input.currentCarbonScore !== 'number' ||
    typeof input.projectedCarbonScore !== 'number' ||
    typeof input.carbonReduction !== 'number'
  ) {
    return { success: false, error: 'Invalid simulation data.' }
  }

  // ----------------------------------------------------------
  // 3. Generate narrative (never throws — falls back internally)
  // ----------------------------------------------------------
  try {
    const narrative = await generateSimulatorNarrative(input)
    return { success: true, narrative }
  } catch {
    return {
      success: false,
      error: 'Narrative generation failed. Please try again.',
    }
  }
}
