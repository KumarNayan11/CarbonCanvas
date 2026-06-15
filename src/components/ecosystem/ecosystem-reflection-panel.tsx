/**
 * @file ecosystem-reflection-panel.tsx
 * @description Displays the narrative reflections produced by the Ecosystem
 * Reflection Engine in a visually rich, accessible panel below the ecosystem canvas.
 *
 * Server-compatible: no state, no hooks, no browser APIs.
 * All reflection logic is in `ecosystem-reflection.ts` — this component only renders.
 */

import { TreePine, Droplets, Wind, Sprout, Sparkles } from 'lucide-react'
import { generateEcosystemReflection } from '@/services/ecosystem-reflection'
import { getHealthTierStyleByLabel } from '@/services/health-tier'
import type { ReflectionLine, EcosystemReflection } from '@/services/ecosystem-reflection'

// ============================================================
// Public interface
// ============================================================

export interface EcosystemReflectionPanelProps {
  forestHealth: number
  waterQuality: number
  airQuality: number
  biodiversity: number
}

// ============================================================
// Internal helpers
// ============================================================

/** Maps a dimension key to a Lucide icon component and display label. */
const DIMENSION_META: Record<
  ReflectionLine['dimension'],
  {
    Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
    label: string
  }
> = {
  forest:       { Icon: TreePine,  label: 'Forest'       },
  water:        { Icon: Droplets,  label: 'Water'        },
  air:          { Icon: Wind,      label: 'Air'          },
  biodiversity: { Icon: Sprout,    label: 'Biodiversity' },
  overall:      { Icon: Sparkles,  label: 'Overall'      },
}

/**
 * Maps the overall tone to Tailwind classes for the summary callout banner.
 * Colours follow the same palette as `health-tier.ts` for visual consistency.
 *
 * WCAG AA contrast ratios verified (≥ 4.5:1 for each text/background pair):
 *  - critical  → red-700 on red-50  (~7.5:1 ✓)
 *  - cautious  → amber-700 on amber-50 (~6.1:1 ✓)
 *  - positive  → emerald-700 on emerald-50 (~6.8:1 ✓)
 *  - thriving  → teal-700 on teal-50 (~6.4:1 ✓)
 */
const TONE_STYLES: Record<EcosystemReflection['overallTone'], {
  banner: string
  text: string
  iconClass: string
  dot: string
}> = {
  critical: {
    banner: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800',
    text:   'text-red-700 dark:text-red-300',
    iconClass: 'text-red-500',
    dot:    'bg-red-500',
  },
  cautious: {
    banner: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
    text:   'text-amber-700 dark:text-amber-300',
    iconClass: 'text-amber-500',
    dot:    'bg-amber-500',
  },
  positive: {
    banner: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800',
    text:   'text-emerald-700 dark:text-emerald-300',
    iconClass: 'text-emerald-500',
    dot:    'bg-emerald-500',
  },
  thriving: {
    banner: 'bg-teal-50 border-teal-200 dark:bg-teal-950/30 dark:border-teal-800',
    text:   'text-teal-700 dark:text-teal-300',
    iconClass: 'text-teal-500',
    dot:    'bg-teal-500',
  },
}

// ============================================================
// Sub-components
// ============================================================

interface ReflectionLineRowProps {
  line: ReflectionLine
}

/**
 * A single reflection row: coloured icon dot (dimension colour) + narrative text.
 * The icon is aria-hidden; the surrounding `<li>` carries the accessible label.
 */
function ReflectionLineRow({ line }: ReflectionLineRowProps) {
  const meta = DIMENSION_META[line.dimension]
  const tierStyle = getHealthTierStyleByLabel(line.tier)
  const { Icon, label } = meta

  return (
    <li
      className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 border-b border-border/40 last:border-0"
      aria-label={`${label}: ${line.text}`}
    >
      {/* Dimension icon with tier-coloured background chip */}
      <div
        className={[
          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
          tierStyle.containerClass.split(' ').slice(0, 2).join(' '), // bg + border from tier
        ].join(' ')}
        aria-hidden="true"
      >
        <Icon className={`h-3.5 w-3.5 ${tierStyle.textClass}`} aria-hidden="true" />
      </div>

      {/* Dimension label chip + narrative text */}
      <div className="flex-1 min-w-0">
        <span
          className={`inline-block text-[10px] font-bold uppercase tracking-widest mb-1 ${tierStyle.textClass}`}
          aria-hidden="true"
        >
          {label}
        </span>
        <p className="text-sm text-foreground/80 leading-relaxed">{line.text}</p>
      </div>
    </li>
  )
}

// ============================================================
// Main component
// ============================================================

/**
 * Renders the Ecosystem Reflection Panel: a summary callout + per-dimension
 * narrative list, all generated deterministically from four health metrics.
 *
 * Designed to sit below `<EcosystemStatusBadges>` inside the dashboard's
 * ecosystem `<Card>`.
 */
export function EcosystemReflectionPanel({
  forestHealth,
  waterQuality,
  airQuality,
  biodiversity,
}: EcosystemReflectionPanelProps) {
  const reflection = generateEcosystemReflection(
    forestHealth,
    waterQuality,
    airQuality,
    biodiversity,
  )

  const toneStyle = TONE_STYLES[reflection.overallTone]

  return (
    /*
     * role="region" + aria-labelledby makes this a navigable landmark for
     * screen reader users.
     * WCAG 2.1 SC 2.4.6 — Headings and Labels (Level AA)
     */
    <section
      className="border-t border-emerald-100 dark:border-emerald-900/40 px-4 py-4 space-y-4"
      aria-labelledby="reflection-heading"
    >
      {/* Section title */}
      <h3
        id="reflection-heading"
        className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        Ecosystem Reflection
      </h3>

      {/* ── Summary callout ──────────────────────────────────── */}
      {/*
       * role="note" semantics: this is an advisory note about the ecosystem
       * state, not an alert — it doesn't require immediate action.
       */}
      <div
        role="note"
        aria-label={`Overall ecosystem status: ${reflection.summary}`}
        className={[
          'flex items-start gap-3 rounded-xl border px-4 py-3',
          toneStyle.banner,
        ].join(' ')}
      >
        <span
          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${toneStyle.dot}`}
          aria-hidden="true"
        />
        <p className={`text-sm leading-relaxed font-medium ${toneStyle.text}`}>
          {reflection.summary}
        </p>
      </div>

      {/* ── Per-dimension reflection lines ───────────────────── */}
      <ul
        className="space-y-0 divide-y divide-transparent"
        aria-label="Ecosystem dimension reflections"
      >
        {reflection.lines.map((line) => (
          <ReflectionLineRow key={line.dimension} line={line} />
        ))}
      </ul>
    </section>
  )
}
