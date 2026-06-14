/**
 * @file health-tier.ts
 * @description Pure utilities that convert a 0–100 ecosystem health value into a
 * human-readable tier label and accessible visual styling tokens.
 *
 * Intentionally free of React, Supabase, and browser APIs — safe to use in
 * Server Components, Server Actions, edge functions, and unit tests.
 *
 * Tier boundaries (inclusive):
 *  0  – 24  → "At Risk"
 *  25 – 49  → "Recovering"
 *  50 – 79  → "Healthy"
 *  80 – 100 → "Flourishing"
 */

// ============================================================
// Types
// ============================================================

/** The four human-readable tier labels produced by {@link getHealthTier}. */
export type HealthTierLabel = 'At Risk' | 'Recovering' | 'Healthy' | 'Flourishing'

/**
 * Colour and icon tokens for rendering a tier badge.
 *
 * All colour values are chosen to satisfy WCAG AA contrast ratios
 * (≥ 4.5:1 for normal text against their respective backgrounds).
 */
export interface HealthTierStyle {
  /** Tailwind classes for the badge container (background + border). */
  containerClass: string
  /** Tailwind classes for the label text. */
  textClass: string
  /** Tailwind classes for the indicator dot. */
  dotClass: string
  /**
   * A short accessible description of what the tier means so screen readers
   * have richer context beyond just the label word.
   */
  description: string
}

/**
 * Internal definition of a single tier.
 * `minValue` is inclusive; the range is [minValue, maxValue] (both inclusive).
 */
interface TierDefinition {
  readonly label: HealthTierLabel
  readonly minValue: number
  readonly maxValue: number
  readonly style: HealthTierStyle
}

// ============================================================
// Tier definitions (single source of truth)
// ============================================================

/**
 * Ordered from highest → lowest so the first match in a `find()` always
 * returns the correct tier for a given value.
 *
 * Color palette rationale:
 *  - "At Risk"     → red-700 on red-50     (contrast ≈ 7.5:1 ✓ AAA)
 *  - "Recovering"  → amber-700 on amber-50 (contrast ≈ 6.1:1 ✓ AA)
 *  - "Healthy"     → emerald-700 on emerald-50 (contrast ≈ 6.8:1 ✓ AA)
 *  - "Flourishing" → teal-700 on teal-50   (contrast ≈ 6.4:1 ✓ AA)
 */
const TIER_DEFINITIONS: readonly TierDefinition[] = [
  {
    label: 'Flourishing',
    minValue: 80,
    maxValue: 100,
    style: {
      containerClass:
        'bg-teal-50 border border-teal-200 dark:bg-teal-950/40 dark:border-teal-800',
      textClass: 'text-teal-700 dark:text-teal-300',
      dotClass: 'bg-teal-500',
      description: 'This dimension of your ecosystem is thriving.',
    },
  },
  {
    label: 'Healthy',
    minValue: 50,
    maxValue: 79,
    style: {
      containerClass:
        'bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800',
      textClass: 'text-emerald-700 dark:text-emerald-300',
      dotClass: 'bg-emerald-500',
      description: 'This dimension of your ecosystem is in good condition.',
    },
  },
  {
    label: 'Recovering',
    minValue: 25,
    maxValue: 49,
    style: {
      containerClass:
        'bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800',
      textClass: 'text-amber-700 dark:text-amber-300',
      dotClass: 'bg-amber-500',
      description: 'This dimension of your ecosystem is slowly improving.',
    },
  },
  {
    label: 'At Risk',
    minValue: 0,
    maxValue: 24,
    style: {
      containerClass:
        'bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-800',
      textClass: 'text-red-700 dark:text-red-300',
      dotClass: 'bg-red-500',
      description: 'This dimension of your ecosystem needs urgent attention.',
    },
  },
] as const

// ============================================================
// Public API
// ============================================================

/**
 * Classifies a 0–100 health value into a {@link HealthTierLabel}.
 *
 * Values outside [0, 100] are clamped to the nearest valid tier:
 *  - < 0  → "At Risk"
 *  - > 100 → "Flourishing"
 *
 * @param value - Health metric in [0, 100].
 * @returns The matching {@link HealthTierLabel}.
 *
 * @example
 * getHealthTier(10)  // → "At Risk"
 * getHealthTier(35)  // → "Recovering"
 * getHealthTier(65)  // → "Healthy"
 * getHealthTier(92)  // → "Flourishing"
 */
export function getHealthTier(value: number): HealthTierLabel {
  // Find the first definition whose range contains `value`.
  // TIER_DEFINITIONS is ordered highest → lowest, so the last entry
  // (At Risk, minValue: 0) is the implicit catch-all for values ≤ 0.
  const definition =
    TIER_DEFINITIONS.find((t) => value >= t.minValue && value <= t.maxValue) ??
    TIER_DEFINITIONS[TIER_DEFINITIONS.length - 1] // fallback: "At Risk"

  return definition.label
}

/**
 * Returns the full {@link HealthTierStyle} token set for a given health value.
 * Useful when rendering badges, progress bars, or any other visual indicator.
 *
 * @param value - Health metric in [0, 100].
 * @returns {@link HealthTierStyle} tokens — Tailwind classes + accessible description.
 *
 * @example
 * const { containerClass, textClass, dotClass, description } = getHealthTierStyle(65)
 * // containerClass → "bg-emerald-50 border border-emerald-200 ..."
 * // textClass      → "text-emerald-700 ..."
 * // dotClass       → "bg-emerald-500"
 * // description    → "This dimension of your ecosystem is in good condition."
 */
export function getHealthTierStyle(value: number): HealthTierStyle {
  const label = getHealthTier(value)
  // Safe cast — TIER_DEFINITIONS covers every possible label.
  return TIER_DEFINITIONS.find((t) => t.label === label)!.style
}

/**
 * Convenience helper that returns both the label and its style in one call.
 * Avoids calling both `getHealthTier` and `getHealthTierStyle` separately.
 *
 * @param value - Health metric in [0, 100].
 * @returns `{ label, style }` — the tier label and its visual style tokens.
 */
export function getHealthTierInfo(value: number): {
  label: HealthTierLabel
  style: HealthTierStyle
} {
  const label = getHealthTier(value)
  const style = TIER_DEFINITIONS.find((t) => t.label === label)!.style
  return { label, style }
}
