/**
 * @file ecosystem-engine.ts
 * @description Pure service module for converting a daily carbon score into
 * ecosystem health metrics that map to the `public.ecosystem_states` DB table.
 *
 * This module is intentionally free of React, Supabase, and any browser/Node-specific
 * APIs. All functions are deterministic and side-effect-free — safe to use in Server
 * Actions, edge functions, tests, and any other context.
 *
 * Phase 2 foundation logic only. No randomness, AI, trends, or historical calculations.
 */

// ============================================================
// Types
// ============================================================

/**
 * Health metrics for the user's virtual ecosystem.
 * Field names are camelCase mirrors of the snake_case DB columns in
 * `public.ecosystem_states`.
 *
 * All values are integers in the range **[0, 100]**.
 */
export interface EcosystemState {
  /** Maps to `forest_health` — integer 0–100. */
  forestHealth: number
  /** Maps to `water_quality` — integer 0–100. */
  waterQuality: number
  /** Maps to `air_quality` — integer 0–100. */
  airQuality: number
  /** Maps to `biodiversity` — integer 0–100. */
  biodiversity: number
}

// ============================================================
// Carbon score → health tier mapping
// ============================================================

/**
 * Internal representation of a health tier.
 * Each tier maps a carbon score range to a fixed health value applied uniformly
 * across all four ecosystem dimensions.
 */
interface HealthTier {
  /** Upper bound of this tier (inclusive). `Infinity` for the highest bracket. */
  readonly maxScore: number
  /** Health value applied to all four ecosystem dimensions. */
  readonly healthValue: number
}

/**
 * Ordered list of health tiers from lowest to highest carbon footprint.
 * Evaluated in order — the first matching tier wins.
 */
const HEALTH_TIERS: readonly HealthTier[] = [
  { maxScore: 5, healthValue: 95 },
  { maxScore: 10, healthValue: 85 },
  { maxScore: 20, healthValue: 65 },
  { maxScore: 30, healthValue: 45 },
  { maxScore: Infinity, healthValue: 25 },
] as const

// ============================================================
// Public API
// ============================================================

/**
 * Converts a daily carbon score (kg CO₂e) into a set of ecosystem health metrics.
 *
 * All four health dimensions (`forestHealth`, `waterQuality`, `airQuality`,
 * `biodiversity`) receive the same value for Phase 2 — determined by which
 * carbon bracket the score falls into:
 *
 * | Carbon score (kg CO₂e) | Health value |
 * |------------------------|-------------|
 * | ≤ 5                    | 95          |
 * | > 5 and ≤ 10           | 85          |
 * | > 10 and ≤ 20          | 65          |
 * | > 20 and ≤ 30          | 45          |
 * | > 30                   | 25          |
 *
 * @param carbonScore - Daily carbon footprint in kg CO₂e (must be ≥ 0).
 * @returns {@link EcosystemState} with all four health values as integers 0–100.
 *
 * @example
 * calculateEcosystemState(3)   // → { forestHealth: 95, waterQuality: 95, airQuality: 95, biodiversity: 95 }
 * calculateEcosystemState(15)  // → { forestHealth: 65, waterQuality: 65, airQuality: 65, biodiversity: 65 }
 * calculateEcosystemState(50)  // → { forestHealth: 25, waterQuality: 25, airQuality: 25, biodiversity: 25 }
 */
export function calculateEcosystemState(carbonScore: number): EcosystemState {
  const tier = HEALTH_TIERS.find((t) => carbonScore <= t.maxScore)

  // HEALTH_TIERS always has a final Infinity entry, so `tier` is always defined.
  // The non-null assertion is safe and avoids a dead-code `throw`.
  const healthValue = tier!.healthValue

  return {
    forestHealth: healthValue,
    waterQuality: healthValue,
    airQuality: healthValue,
    biodiversity: healthValue,
  }
}

/**
 * Computes the overall ecosystem health as the arithmetic mean of all four
 * health dimensions, rounded to the nearest integer.
 *
 * @param state - An {@link EcosystemState} with values in [0, 100].
 * @returns Overall health score as an integer in [0, 100].
 *
 * @example
 * calculateOverallHealth({ forestHealth: 95, waterQuality: 95, airQuality: 95, biodiversity: 95 })
 * // → 95
 *
 * calculateOverallHealth({ forestHealth: 80, waterQuality: 60, airQuality: 70, biodiversity: 90 })
 * // → 75
 */
export function calculateOverallHealth(state: EcosystemState): number {
  const sum =
    state.forestHealth + state.waterQuality + state.airQuality + state.biodiversity
  return Math.round(sum / 4)
}
