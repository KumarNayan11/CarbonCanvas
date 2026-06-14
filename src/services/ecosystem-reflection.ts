/**
 * @file ecosystem-reflection.ts
 * @description Deterministic Ecosystem Reflection Engine.
 *
 * Converts four raw health metrics (0–100 each) into a structured set of
 * human-readable narrative sentences — no AI API, no randomness, no side effects.
 *
 * Design goals:
 *  - Entirely data-driven: sentence templates are pure lookup tables.
 *  - Cross-dimensional awareness: each reflection can reference the state of
 *    related dimensions (e.g. forest health influencing biodiversity).
 *  - Educational & encouraging: language is constructive rather than alarming.
 *  - Pure functions: deterministic for identical inputs (safe for SSR / testing).
 *
 * Depends on:
 *  - {@link getHealthTier} from `health-tier.ts` (avoids re-implementing tier logic).
 */

import { getHealthTier } from '@/services/health-tier'
import type { HealthTierLabel } from '@/services/health-tier'

// ============================================================
// Public types
// ============================================================

/**
 * A single reflection sentence with metadata about which dimension it describes
 * and the tier that triggered it.
 */
export interface ReflectionLine {
  /** The narrative sentence to display. */
  text: string
  /** Which ecosystem dimension this line primarily describes. */
  dimension: 'forest' | 'water' | 'air' | 'biodiversity' | 'overall'
  /** The tier of that dimension at the time of generation. */
  tier: HealthTierLabel
}

/**
 * The complete set of reflections generated for one ecosystem state snapshot.
 * Callers can display `lines` individually or `summary` as a standalone callout.
 */
export interface EcosystemReflection {
  /**
   * One reflection per dimension (forest, water, air, biodiversity)
   * plus one overall summary — 5 lines total.
   */
  lines: ReflectionLine[]
  /** Single-sentence holistic summary of the entire ecosystem state. */
  summary: string
  /**
   * Overall tone used to drive UI styling (e.g. card border colour).
   * Derived from the mean of all four tiers.
   */
  overallTone: 'critical' | 'cautious' | 'positive' | 'thriving'
}

// ============================================================
// Internal helpers
// ============================================================

/**
 * Converts a {@link HealthTierLabel} to a numeric weight for averaging.
 * Used internally to compute the overall ecosystem tone.
 */
function tierWeight(label: HealthTierLabel): number {
  switch (label) {
    case 'At Risk':     return 0
    case 'Recovering':  return 1
    case 'Healthy':     return 2
    case 'Flourishing': return 3
  }
}

/**
 * Maps a floating-point average tier weight back to a tone string.
 * Thresholds match the four label weights with a half-step at each boundary.
 */
function weightToTone(avg: number): EcosystemReflection['overallTone'] {
  if (avg < 0.5) return 'critical'
  if (avg < 1.5) return 'cautious'
  if (avg < 2.5) return 'positive'
  return 'thriving'
}

// ============================================================
// Sentence template tables
// ============================================================

/**
 * Each dimension has four sentence templates, one per tier.
 * Templates may reference the tier labels of related dimensions via
 * interpolation — we keep them as functions that receive a `context` object
 * so they remain pure and avoid string mutation at the call site.
 */

interface ReflectionContext {
  forestTier: HealthTierLabel
  waterTier: HealthTierLabel
  airTier: HealthTierLabel
  biodiversityTier: HealthTierLabel
}

type TemplateFn = (ctx: ReflectionContext) => string

/** Per-dimension, per-tier sentence generators. */
const TEMPLATES: Record<'forest' | 'water' | 'air' | 'biodiversity', Record<HealthTierLabel, TemplateFn>> = {

  // ── Forest ──────────────────────────────────────────────────────────────────
  forest: {
    'At Risk': (ctx) =>
      ctx.biodiversityTier === 'At Risk'
        ? 'Forest health is critically low and, combined with declining biodiversity, the ecosystem is under serious strain — reducing your daily carbon footprint can begin the recovery process.'
        : 'Forest health has dropped to a critical level; the remaining vegetation is struggling to sustain itself and needs your attention urgently.',

    'Recovering': (ctx) =>
      ctx.waterTier === 'Healthy' || ctx.waterTier === 'Flourishing'
        ? 'Forest health is slowly recovering, aided by good water availability — keep building on your low-carbon habits to accelerate this growth.'
        : 'Forest health is on a slow path to recovery; consistent daily choices will help the woodland regain its strength.',

    'Healthy': (ctx) =>
      ctx.biodiversityTier === 'Flourishing'
        ? 'Forest health remains strong and is actively supporting the flourishing biodiversity around it — a great sign of a balanced ecosystem.'
        : 'Forest health is in good shape, providing shelter and resources that underpin the wider ecosystem.',

    'Flourishing': (ctx) =>
      ctx.airTier === 'Flourishing'
        ? 'The forest is flourishing alongside clean air, creating a virtuous cycle where canopy and atmosphere mutually reinforce each other.'
        : 'Forest health is thriving — dense canopy cover is locking in carbon and sheltering wildlife effectively.',
  },

  // ── Water ───────────────────────────────────────────────────────────────────
  water: {
    'At Risk': (ctx) =>
      ctx.biodiversityTier === 'At Risk'
        ? 'Water quality is critically poor, and this is directly limiting biodiversity recovery — cleaner water pathways are essential to break this cycle.'
        : 'Water quality has fallen to a critical level; aquatic habitats are under stress and urgently need your lifestyle changes to reverse this trend.',

    'Recovering': (ctx) =>
      ctx.forestTier === 'Healthy' || ctx.forestTier === 'Flourishing'
        ? 'Water quality is gradually improving, helped by healthy forest root systems that filter runoff — your choices are beginning to make a measurable difference.'
        : 'Water quality is slowly climbing back; reducing energy and transport emissions will help clear the remaining pollutants.',

    'Healthy': (ctx) =>
      ctx.biodiversityTier === 'Recovering' || ctx.biodiversityTier === 'At Risk'
        ? 'Water quality is healthy and providing a vital lifeline for biodiversity that is still finding its footing — keep protecting it.'
        : 'Water quality is in good condition, supporting aquatic life and helping regulate the surrounding land temperature.',

    'Flourishing': (ctx) =>
      ctx.forestTier === 'Flourishing'
        ? 'Water quality is exceptional; combined with a thriving forest, streams and rivers are at their clearest and most biodiverse.'
        : 'Water quality is at its best, reflecting the positive impact of your consistent low-carbon choices on local water systems.',
  },

  // ── Air ─────────────────────────────────────────────────────────────────────
  air: {
    'At Risk': (ctx) =>
      ctx.forestTier === 'At Risk'
        ? 'Air quality is critically low and the diminished forest cover means there is little natural filtration left — addressing your carbon output is the most impactful step you can take.'
        : 'Air quality is at a critical low; atmospheric pollutants are beginning to affect the broader ecosystem balance and need to be addressed.',

    'Recovering': (ctx) =>
      ctx.forestTier === 'Healthy' || ctx.forestTier === 'Flourishing'
        ? 'Air quality is gradually clearing, with the healthy forest acting as a natural filter — sustained effort will push it into the healthy range.'
        : 'Air quality is slowly improving; each low-emission choice reduces the atmospheric load and helps wildlife breathe easier.',

    'Healthy': (ctx) =>
      ctx.waterTier === 'Healthy' || ctx.waterTier === 'Flourishing'
        ? 'Air quality is good and working in tandem with clean water to create a well-balanced, resilient ecosystem.'
        : 'Air quality is healthy, allowing photosynthesis and wildlife respiration to proceed without stress.',

    'Flourishing': (ctx) =>
      ctx.forestTier === 'Flourishing'
        ? 'Air quality is outstanding; the flourishing forest and pristine atmosphere are reinforcing each other in a powerful positive feedback loop.'
        : 'Air quality is at its peak — clear skies are energising every layer of your ecosystem and amplifying the impact of your other healthy metrics.',
  },

  // ── Biodiversity ────────────────────────────────────────────────────────────
  biodiversity: {
    'At Risk': (ctx) =>
      ctx.forestTier === 'At Risk' && ctx.waterTier === 'At Risk'
        ? 'Biodiversity is critically endangered across the entire ecosystem — without forest cover or clean water, species have very few refuges left. Every positive choice you make now is vital.'
        : 'Biodiversity has dropped to a critical level; species variety is shrinking and the ecosystem is losing its natural resilience.',

    'Recovering': (ctx) =>
      ctx.forestTier === 'Healthy' || ctx.forestTier === 'Flourishing'
        ? 'Biodiversity is slowly recovering, drawing strength from the healthy forest that provides food and habitat — continued care will accelerate species return.'
        : 'Biodiversity is on the mend; native species are gradually reclaiming their niches as conditions improve day by day.',

    'Healthy': (ctx) =>
      ctx.waterTier === 'Healthy' || ctx.waterTier === 'Flourishing'
        ? 'Biodiversity is healthy, thriving on the clean water and stable habitat conditions your choices have helped create.'
        : 'Biodiversity is in good shape — a variety of species are finding the ecosystem stable enough to flourish.',

    'Flourishing': (ctx) =>
      ctx.forestTier === 'Flourishing' && ctx.waterTier === 'Flourishing'
        ? 'Biodiversity is extraordinary — with a thriving forest and pristine water, species richness has reached its peak and the ecosystem is self-sustaining.'
        : 'Biodiversity is flourishing; a rich tapestry of species reflects the long-term benefits of your sustained low-carbon lifestyle.',
  },
}

/** Overall summary sentences keyed by {@link EcosystemReflection.overallTone}. */
const SUMMARY_TEMPLATES: Record<EcosystemReflection['overallTone'], TemplateFn> = {
  critical: (ctx) => {
    // Identify the most critical dimension to call out specifically
    const criticalDims: string[] = []
    if (ctx.forestTier === 'At Risk')       criticalDims.push('forest cover')
    if (ctx.waterTier === 'At Risk')        criticalDims.push('water quality')
    if (ctx.airTier === 'At Risk')          criticalDims.push('air quality')
    if (ctx.biodiversityTier === 'At Risk') criticalDims.push('biodiversity')
    const focus = criticalDims.slice(0, 2).join(' and ') || 'multiple dimensions'
    return `Your ecosystem is under significant pressure — ${focus} need urgent attention. Small, consistent reductions in your daily carbon output will begin to shift the balance.`
  },

  cautious: (ctx) => {
    const recovering: string[] = []
    if (ctx.forestTier === 'Recovering')       recovering.push('forest')
    if (ctx.waterTier === 'Recovering')        recovering.push('water')
    if (ctx.airTier === 'Recovering')          recovering.push('air')
    if (ctx.biodiversityTier === 'Recovering') recovering.push('biodiversity')
    const dims = recovering.length > 0
      ? recovering.join(', ')
      : 'several dimensions'
    return `Your ecosystem is in recovery mode — ${dims} are showing signs of improvement. Keeping your carbon footprint low now will accelerate the healing process.`
  },

  positive: (ctx) => {
    const healthy: string[] = []
    if (ctx.forestTier === 'Healthy' || ctx.forestTier === 'Flourishing')       healthy.push('forest')
    if (ctx.waterTier === 'Healthy' || ctx.waterTier === 'Flourishing')         healthy.push('water')
    if (ctx.airTier === 'Healthy' || ctx.airTier === 'Flourishing')             healthy.push('air')
    if (ctx.biodiversityTier === 'Healthy' || ctx.biodiversityTier === 'Flourishing') healthy.push('biodiversity')
    const dims = healthy.join(', ')
    return `Your ecosystem is in good health overall, with ${dims} performing well. Maintaining your current habits will push the remaining dimensions into a flourishing state.`
  },

  thriving: () =>
    'Your ecosystem is thriving across all dimensions — a testament to the cumulative impact of your daily low-carbon choices. You are building a genuinely resilient virtual world.',
}

// ============================================================
// Public API
// ============================================================

/**
 * Generates a complete {@link EcosystemReflection} from four health metrics.
 *
 * All logic is deterministic and side-effect-free. Identical inputs will
 * always produce identical outputs.
 *
 * @param forestHealth   - Forest health metric (0–100).
 * @param waterQuality   - Water quality metric (0–100).
 * @param airQuality     - Air quality metric (0–100).
 * @param biodiversity   - Biodiversity metric (0–100).
 * @returns A {@link EcosystemReflection} containing five lines and a summary.
 *
 * @example
 * const r = generateEcosystemReflection(85, 62, 30, 91)
 * r.lines[0].text  // → "The forest is flourishing alongside clean air, creating…"
 * r.summary        // → "Your ecosystem is in good health overall…"
 * r.overallTone    // → "positive"
 */
export function generateEcosystemReflection(
  forestHealth: number,
  waterQuality: number,
  airQuality: number,
  biodiversity: number,
): EcosystemReflection {
  // 1. Classify each dimension
  const forestTier = getHealthTier(forestHealth)
  const waterTier  = getHealthTier(waterQuality)
  const airTier    = getHealthTier(airQuality)
  const biodiversityTier = getHealthTier(biodiversity)

  const ctx: ReflectionContext = { forestTier, waterTier, airTier, biodiversityTier }

  // 2. Build per-dimension reflection lines
  const lines: ReflectionLine[] = [
    {
      dimension: 'forest',
      tier: forestTier,
      text: TEMPLATES.forest[forestTier](ctx),
    },
    {
      dimension: 'water',
      tier: waterTier,
      text: TEMPLATES.water[waterTier](ctx),
    },
    {
      dimension: 'air',
      tier: airTier,
      text: TEMPLATES.air[airTier](ctx),
    },
    {
      dimension: 'biodiversity',
      tier: biodiversityTier,
      text: TEMPLATES.biodiversity[biodiversityTier](ctx),
    },
  ]

  // 3. Compute overall tone from mean tier weight
  const avgWeight =
    (tierWeight(forestTier) + tierWeight(waterTier) + tierWeight(airTier) + tierWeight(biodiversityTier)) / 4

  const overallTone = weightToTone(avgWeight)

  // 4. Generate summary
  const summary = SUMMARY_TEMPLATES[overallTone](ctx)

  return { lines, summary, overallTone }
}
