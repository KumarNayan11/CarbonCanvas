/**
 * @file ecosystem-status-badges.tsx
 * @description A responsive grid of status badges showing the human-readable
 * health tier for each of the four ecosystem dimensions.
 *
 * Server-compatible: no state, no hooks, no browser APIs.
 * All styling logic is delegated to `getHealthTierInfo` from the service layer —
 * this component contains zero tier-classification logic of its own.
 */

import { TreePine, Droplets, Wind, Sprout } from 'lucide-react'
import { getHealthTierInfo } from '@/services/health-tier'
import type { HealthTierLabel } from '@/services/health-tier'

// ============================================================
// Public interface
// ============================================================

export interface EcosystemStatusBadgesProps {
  /** Maps to `forest_health` (0–100) */
  forestHealth: number
  /** Maps to `water_quality` (0–100) */
  waterQuality: number
  /** Maps to `air_quality` (0–100) */
  airQuality: number
  /** Maps to `biodiversity` (0–100) */
  biodiversity: number
}

// ============================================================
// Internal types
// ============================================================

interface DimensionConfig {
  /** Human-readable dimension name shown in the badge label. */
  name: string
  /** Current numeric health value for this dimension. */
  value: number
  /** Lucide icon component for this dimension. */
  Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  /** Unique DOM id for the badge — used for `aria-labelledby`. */
  id: string
}

// ============================================================
// Sub-component
// ============================================================

interface BadgeProps {
  dimension: DimensionConfig
}

/**
 * A single dimension badge: icon + dimension name + tier label + value pill.
 * Uses `aria-label` on the root element to provide a complete description for
 * assistive technology without relying on visual layout.
 *
 * WCAG 2.1 SC 1.4.1 — Use of Color:
 * Color is never the *only* means of conveying tier information — we also show
 * the text label ("Flourishing", "Healthy", etc.) and a unique icon per dimension.
 */
function DimensionBadge({ dimension }: BadgeProps) {
  const { label, style } = getHealthTierInfo(dimension.value)

  // Full accessible description: "Forest: Healthy (65 / 100)"
  const accessibleLabel = `${dimension.name}: ${label} (${dimension.value} out of 100)`

  return (
    <div
      id={dimension.id}
      role="status"
      aria-label={accessibleLabel}
      aria-atomic="true"
      className={[
        'flex items-center gap-3 rounded-xl px-4 py-3',
        'transition-all duration-200',
        style.containerClass,
      ].join(' ')}
    >
      {/* Dimension icon — purely decorative since the label text is self-describing */}
      <dimension.Icon
        className={`h-4 w-4 shrink-0 ${style.textClass}`}
        aria-hidden="true"
      />

      {/* Dimension name */}
      <span className={`text-sm font-medium shrink-0 ${style.textClass}`}>
        {dimension.name}
      </span>

      {/* Spacer — pushes tier pill to the right */}
      <span className="flex-1" aria-hidden="true" />

      {/* Tier pill: dot + label */}
      <TierPill label={label} dotClass={style.dotClass} textClass={style.textClass} />
    </div>
  )
}

// ============================================================
// Tier pill
// ============================================================

interface TierPillProps {
  label: HealthTierLabel
  dotClass: string
  textClass: string
}

/**
 * Small pill showing the coloured indicator dot and the tier label text.
 * The dot is `aria-hidden` — the tier word carries the semantic meaning.
 */
function TierPill({ label, dotClass, textClass }: TierPillProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`h-2 w-2 rounded-full shrink-0 ${dotClass}`}
        aria-hidden="true"
      />
      <span className={`text-xs font-semibold tabular-nums ${textClass}`}>
        {label}
      </span>
    </span>
  )
}

// ============================================================
// Main component
// ============================================================

/**
 * Renders a 2×2 responsive grid of ecosystem dimension status badges.
 *
 * On mobile (< sm) the grid is a single column; from `sm` breakpoint it becomes
 * 2 columns, keeping the layout comfortable on all screen sizes.
 *
 * @example
 * <EcosystemStatusBadges
 *   forestHealth={85}
 *   waterQuality={62}
 *   airQuality={30}
 *   biodiversity={91}
 * />
 */
export function EcosystemStatusBadges({
  forestHealth,
  waterQuality,
  airQuality,
  biodiversity,
}: EcosystemStatusBadgesProps) {
  /**
   * Dimension configuration array — defines the display order and metadata
   * for each of the four ecosystem health dimensions.
   *
   * Ordering rationale: Forest → Water → Air → Biodiversity matches the
   * natural "scene" layers in EcosystemCanvas (ground, river, sky, flora).
   */
  const dimensions: DimensionConfig[] = [
    {
      name: 'Forest',
      value: forestHealth,
      Icon: TreePine,
      id: 'badge-forest',
    },
    {
      name: 'Water',
      value: waterQuality,
      Icon: Droplets,
      id: 'badge-water',
    },
    {
      name: 'Air',
      value: airQuality,
      Icon: Wind,
      id: 'badge-air',
    },
    {
      name: 'Biodiversity',
      value: biodiversity,
      Icon: Sprout,
      id: 'badge-biodiversity',
    },
  ]

  return (
    /*
     * The wrapping <div> is not a landmark — the caller (dashboard page) already
     * wraps the canvas + badges in a <section aria-labelledby="ecosystem-heading">.
     * We only need a visual grouping container here.
     */
    <div
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 pt-3 border-t border-emerald-100 dark:border-emerald-900/40"
      aria-label="Ecosystem dimension health status"
    >
      {dimensions.map((dim) => (
        <DimensionBadge key={dim.id} dimension={dim} />
      ))}
    </div>
  )
}
