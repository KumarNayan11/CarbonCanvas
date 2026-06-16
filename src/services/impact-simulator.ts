/**
 * @file impact-simulator.ts
 * @description Pure mathematical engine for "what-if" carbon impact simulations.
 *
 * This module accepts a user's current {@link DailyEntry} alongside a partial set of
 * hypothetical activity changes ({@link SimulationChanges}), and computes the difference
 * in carbon footprint between the current reality and the hypothetical scenario.
 *
 * ## Design Constraints
 * - **Pure functions only** — no side effects, no randomness.
 * - **No React, no Supabase, no database access** — safe to call from any context.
 * - **Reuses existing formulas** from `carbon-calculator.ts` exclusively.
 *   No emission factors are duplicated here.
 * - **Fully unit-testable** — every exported function is deterministic.
 *
 * ## Relationship to carbon-calculator.ts
 * `carbon-calculator.ts` owns all emission factors and individual calculation functions.
 * This module is a higher-level consumer: it bridges the DB-shaped `DailyEntry`
 * (snake_case, nullable fields) into the calculator's `CarbonCalculationInput`
 * (camelCase, required fields), applies hypothetical overrides, then computes a diff.
 */

import {
  calculateTotalCarbon,
  type CarbonCalculationInput,
  type TransportType,
  type FoodType,
} from './carbon-calculator'
import { calculateEcosystemState, type EcosystemState } from './ecosystem-engine'
import type { DailyEntry } from '@/types'

// ============================================================
// Defaults
// ============================================================

/**
 * Fallback values applied when a `DailyEntry` field is `null`.
 *
 * Uses 'unknown' types and conservative averages rather than zero-impact defaults
 * to prevent simulations from underestimating carbon emissions when data is incomplete.
 */
const ENTRY_DEFAULTS = {
  transportType: 'unknown' as TransportType,
  transportDistanceKm: 15, // Conservative average daily travel
  foodType: 'unknown' as FoodType,
  energyUsageKwh: 10, // Conservative average daily household usage
  shoppingItems: 1, // Conservative average
} as const

// ============================================================
// Simulation types
// ============================================================

/**
 * A partial set of hypothetical activity changes to apply over a {@link DailyEntry}.
 *
 * Every field is optional — only the fields you provide will be overridden.
 * Omitted fields fall back to the values already recorded in the current entry
 * (or to {@link ENTRY_DEFAULTS} for any field that is `null` in the entry).
 *
 * @example
 * // "What if I cycled instead of drove, and ate vegetarian?"
 * const changes: SimulationChanges = {
 *   transport_type: 'bicycle',
 *   transport_distance_km: 10,
 *   food_type: 'vegetarian',
 * }
 */
export interface SimulationChanges {
  /** Hypothetical mode of transport. Maps to `transport_type` in `daily_entries`. */
  transport_type?: TransportType
  /** Hypothetical travel distance in kilometres. Maps to `transport_distance_km`. */
  transport_distance_km?: number
  /** Hypothetical dietary category. Maps to `food_type` in `daily_entries`. */
  food_type?: FoodType
  /** Hypothetical energy consumption in kWh. Maps to `energy_usage_kwh`. */
  energy_usage_kwh?: number
  /** Hypothetical number of shopping items purchased. Maps to `shopping_items`. */
  shopping_items?: number
}

/**
 * The result produced by {@link simulateImpact}.
 *
 * All carbon values are in **kg CO₂e**, rounded to 2 decimal places.
 * Reduction values are positive when the scenario is better than the current
 * reality, and negative when it is worse.
 */
export interface SimulationResult {
  /**
   * The carbon footprint of the **current** daily entry in kg CO₂e.
   * Derived directly from the entry passed to {@link simulateImpact}.
   */
  currentCarbonScore: number

  /**
   * The carbon footprint of the **hypothetical** scenario in kg CO₂e.
   * Computed by applying `SimulationChanges` on top of the current entry.
   */
  projectedCarbonScore: number

  /**
   * Absolute difference: `currentCarbonScore − projectedCarbonScore` in kg CO₂e.
   * Positive  → the scenario emits *less* carbon (an improvement).
   * Negative  → the scenario emits *more* carbon (a regression).
   * Zero      → no change.
   */
  carbonReduction: number

  /**
   * Relative reduction as a percentage of the current score.
   * Positive  → improvement.
   * Negative  → regression.
   * `null`    → when `currentCarbonScore === 0` (division by zero is not meaningful).
   *
   * @example
   * // currentCarbonScore: 10, projectedCarbonScore: 7
   * // reductionPercentage: 30  (meaning "30% less CO₂")
   */
  reductionPercentage: number | null

  /**
   * The ecosystem health metrics corresponding to the `currentCarbonScore`.
   * Reuses the canonical DB transformation logic from the ecosystem engine.
   */
  currentEcosystem: EcosystemState

  /**
   * The predicted ecosystem health metrics if the hypothetical scenario
   * were adopted, based on the `projectedCarbonScore`.
   */
  projectedEcosystem: EcosystemState

  /**
   * The absolute difference in each ecosystem metric:
   * `projectedEcosystem.metric - currentEcosystem.metric`.
   * Positive  → the scenario improves the ecosystem.
   * Negative  → the scenario degrades the ecosystem.
   * Zero      → no change to this metric.
   */
  ecosystemImprovement: {
    forestHealth: number
    waterQuality: number
    airQuality: number
    biodiversity: number
  }
}

// ============================================================
// Internal helpers
// ============================================================

/**
 * Converts a DB-shaped {@link DailyEntry} into the camelCase
 * {@link CarbonCalculationInput} expected by the carbon calculator.
 *
 * Nullable entry fields are substituted with {@link ENTRY_DEFAULTS} so that
 * the calculator always receives fully-typed, non-null inputs.
 *
 * @param entry - A row from `public.daily_entries` (nullable fields allowed).
 * @returns A fully-populated `CarbonCalculationInput` safe to pass to the calculator.
 *
 * @internal
 */
function entryToCalculationInput(entry: DailyEntry): CarbonCalculationInput {
  return {
    transportType: (entry.transport_type as TransportType) ?? ENTRY_DEFAULTS.transportType,
    transportDistanceKm: entry.transport_distance_km ?? ENTRY_DEFAULTS.transportDistanceKm,
    foodType: (entry.food_type as FoodType) ?? ENTRY_DEFAULTS.foodType,
    energyUsageKwh: entry.energy_usage_kwh ?? ENTRY_DEFAULTS.energyUsageKwh,
    shoppingItems: entry.shopping_items ?? ENTRY_DEFAULTS.shoppingItems,
  }
}

/**
 * Merges hypothetical {@link SimulationChanges} on top of a base
 * {@link CarbonCalculationInput}, producing the projected scenario input.
 *
 * Only fields present in `changes` are overridden; all other fields are
 * carried forward unchanged from the base input.
 *
 * @param base    - The current activity, already coerced from a `DailyEntry`.
 * @param changes - The partial set of hypothetical overrides.
 * @returns A new `CarbonCalculationInput` representing the hypothetical scenario.
 *
 * @internal
 */
function applySimulationChanges(
  base: CarbonCalculationInput,
  changes: SimulationChanges,
): CarbonCalculationInput {
  return {
    transportType: changes.transport_type ?? base.transportType,
    transportDistanceKm: changes.transport_distance_km ?? base.transportDistanceKm,
    foodType: changes.food_type ?? base.foodType,
    energyUsageKwh: changes.energy_usage_kwh ?? base.energyUsageKwh,
    shoppingItems: changes.shopping_items ?? base.shoppingItems,
  }
}

/**
 * Rounds a number to 2 decimal places using the same strategy as
 * `calculateTotalCarbon` in `carbon-calculator.ts`, ensuring that
 * subtraction of two independently-rounded values remains consistent.
 *
 * @param value - The raw floating-point number to round.
 * @returns The value rounded to 2 decimal places.
 *
 * @internal
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100
}

// ============================================================
// Public API
// ============================================================

/**
 * Computes the carbon impact of a hypothetical "what-if" scenario against
 * the user's current daily entry.
 *
 * The function:
 * 1. Converts the DB-shaped `entry` into a `CarbonCalculationInput` (handling nulls).
 * 2. Computes the **current** carbon score by calling `calculateTotalCarbon`.
 * 3. Merges the `changes` on top of the base input to form the projected scenario.
 * 4. Computes the **projected** carbon score using the same `calculateTotalCarbon`.
 * 5. Derives `carbonReduction` and `reductionPercentage` from the two scores.
 *
 * All emission factors live exclusively in `carbon-calculator.ts`. This
 * function never duplicates them.
 *
 * @param entry   - The user's current `DailyEntry` row from the database.
 * @param changes - A partial record of hypothetical activity overrides.
 * @returns A {@link SimulationResult} containing current score, projected score,
 *          absolute reduction, and relative reduction percentage.
 *
 * @example
 * // A user currently drives 20 km and eats a mixed diet.
 * // What if they cycled 10 km and ate vegetarian?
 * const result = simulateImpact(entry, {
 *   transport_type: 'bicycle',
 *   transport_distance_km: 10,
 *   food_type: 'vegetarian',
 * })
 * // result.currentCarbonScore  → 11.45
 * // result.projectedCarbonScore → 1.5
 * // result.carbonReduction      → 9.95
 * // result.reductionPercentage  → 86.9...
 */
export function simulateImpact(
  entry: DailyEntry,
  changes: SimulationChanges,
): SimulationResult {
  // Step 1: Map the DB entry into the shape the calculator expects.
  const currentInput = entryToCalculationInput(entry)

  // Step 2: Compute the current carbon score — reuses the canonical formula.
  const currentCarbonScore = calculateTotalCarbon(currentInput)

  // Step 3: Build the hypothetical scenario by overlaying the changes.
  const projectedInput = applySimulationChanges(currentInput, changes)

  // Step 4: Compute the projected score using the same canonical formula.
  const projectedCarbonScore = calculateTotalCarbon(projectedInput)

  // Step 5: Derive the carbon reduction metrics.
  const carbonReduction = round2(currentCarbonScore - projectedCarbonScore)

  const reductionPercentage =
    currentCarbonScore === 0
      ? null
      : round2((carbonReduction / currentCarbonScore) * 100)

  // Step 6: Compute the ecosystem state projections using the shared engine.
  const currentEcosystem = calculateEcosystemState(currentCarbonScore)
  const projectedEcosystem = calculateEcosystemState(projectedCarbonScore)

  // Step 7: Derive the metric-by-metric ecosystem improvements.
  const ecosystemImprovement = {
    forestHealth: projectedEcosystem.forestHealth - currentEcosystem.forestHealth,
    waterQuality: projectedEcosystem.waterQuality - currentEcosystem.waterQuality,
    airQuality: projectedEcosystem.airQuality - currentEcosystem.airQuality,
    biodiversity: projectedEcosystem.biodiversity - currentEcosystem.biodiversity,
  }

  return {
    currentCarbonScore,
    projectedCarbonScore,
    carbonReduction,
    reductionPercentage,
    currentEcosystem,
    projectedEcosystem,
    ecosystemImprovement,
  }
}

/**
 * A convenience wrapper that runs **multiple** what-if scenarios against the
 * same base entry in a single call, returning one {@link SimulationResult}
 * per scenario in the same order they were provided.
 *
 * Useful for rendering a comparison table of several lifestyle changes side
 * by side without calling `simulateImpact` repeatedly in the UI layer.
 *
 * @param entry    - The user's current `DailyEntry` row from the database.
 * @param scenarios - An array of partial activity overrides, one per scenario.
 * @returns An array of `SimulationResult` objects, one per scenario (same order).
 *
 * @example
 * const [busSwitchResult, trainSwitchResult, veganResult] = simulateMultiple(
 *   entry,
 *   [
 *     { transport_type: 'bus', transport_distance_km: 20 },
 *     { transport_type: 'train', transport_distance_km: 20 },
 *     { food_type: 'vegetarian' },
 *   ],
 * )
 */
export function simulateMultiple(
  entry: DailyEntry,
  scenarios: SimulationChanges[],
): SimulationResult[] {
  return scenarios.map((changes) => simulateImpact(entry, changes))
}

/**
 * Determines whether a simulation scenario represents an **improvement**
 * over the current entry (i.e., results in a strictly lower carbon score).
 *
 * This is a pure predicate extracted so that call sites in the UI or
 * narrative engine don't need to repeat the comparison logic.
 *
 * @param result - The result of a prior {@link simulateImpact} call.
 * @returns `true` if the projected score is lower than the current score.
 *
 * @example
 * const result = simulateImpact(entry, { transport_type: 'bicycle' })
 * if (isImprovingScenario(result)) {
 *   // show green badge
 * }
 */
export function isImprovingScenario(result: SimulationResult): boolean {
  return result.projectedCarbonScore < result.currentCarbonScore
}
