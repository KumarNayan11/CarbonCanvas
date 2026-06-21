/**
 * @file simulator-narrative-panel.tsx
 * @description Displays the three-part what-if narrative produced by the
 * simulator narrative service below the ecosystem comparison section.
 *
 * Renders three distinct labelled cards (Observation / Implication / Action)
 * using the project's existing design language — emerald palette, shadcn/ui
 * Card primitives, and Lucide icons.
 *
 * Accessibility:
 * - `role="region"` + `aria-labelledby` makes this a navigable landmark.
 * - Each card has an explicit `aria-label` so screen readers announce the
 *   section label alongside the content.
 * - Loading skeleton uses `aria-busy` and `aria-label` for polling UAs.
 * - AI-generated badge is `aria-hidden` to avoid redundant announcements.
 *
 * Constraints:
 * - Client Component: accepts state props, no server-side data fetching here.
 * - Never writes to the database.
 * - Isolated from dashboard insight generation.
 */

import { Eye, Leaf, Lightbulb, Sparkles, AlertCircle, RotateCcw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { SimulatorNarrative } from '@/services/simulator-narrative'

// ============================================================
// Sub-components
// ============================================================

/**
 * Skeleton placeholder shown while the narrative is loading.
 * Mirrors the three-card layout to prevent layout shift (CLS).
 */
export function SimulatorNarrativeSkeleton() {
  return (
    <section
      aria-labelledby="simulator-narrative-heading"
      aria-busy="true"
      aria-label="Loading AI narrative…"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" aria-hidden="true" />
        <h3
          id="simulator-narrative-heading"
          className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
        >
          AI What-If Narrative
        </h3>
      </div>

      <Card className="border-emerald-100 dark:border-emerald-900/40 shadow-md">
        <CardContent className="p-6 space-y-5">
          {[
            { icon: Eye,        label: 'Observation'    },
            { icon: Leaf,       label: 'Implication'    },
            { icon: Lightbulb,  label: 'Suggested Action' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-start gap-3"
              aria-label={`${label}: loading`}
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-100/60 dark:bg-emerald-900/30">
                <Icon className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              </div>
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-2.5 w-24 rounded bg-muted animate-pulse" />
                <div className="h-2 w-full rounded bg-muted animate-pulse" />
                <div className="h-2 w-4/5 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}

/**
 * Static placeholder shown before the user makes any simulation changes.
 * Prevents layout shift (CLS) and explains the feature.
 */
export function SimulatorNarrativeIdle() {
  return (
    <section aria-labelledby="simulator-narrative-idle-heading">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-emerald-500/50" aria-hidden="true" />
        <h3
          id="simulator-narrative-idle-heading"
          className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
        >
          AI What-If Narrative
        </h3>
      </div>
      <Card className="border-dashed border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10 shadow-none">
        <CardContent className="p-8 text-center space-y-2">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Awaiting scenario changes
          </p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Adjust the simulation parameters above to generate a personalized what-if narrative using Gemini AI.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}

// ============================================================
// Narrative card row
// ============================================================

interface NarrativeRowProps {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  label: string
  text: string
  accentClass: string
  iconClass: string
}

function NarrativeRow({ icon: Icon, label, text, accentClass, iconClass }: NarrativeRowProps) {
  return (
    <div
      className="flex items-start gap-3 py-4 first:pt-0 last:pb-0 border-b border-border/40 last:border-0"
      aria-label={`${label}: ${text}`}
    >
      {/* Icon chip */}
      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${accentClass}`}
        aria-hidden="true"
      >
        <Icon className={`h-3.5 w-3.5 ${iconClass}`} aria-hidden="true" />
      </div>

      {/* Label + text */}
      <div className="flex-1 min-w-0">
        <span
          className={`inline-block text-[10px] font-bold uppercase tracking-widest mb-1 ${iconClass}`}
          aria-hidden="true"
        >
          {label}
        </span>
        <p className="text-sm text-foreground/80 leading-relaxed">{text}</p>
      </div>
    </div>
  )
}

// ============================================================
// Main component
// ============================================================

export interface SimulatorNarrativePanelProps {
  narrative: SimulatorNarrative
}

/**
 * Renders the three-part simulator narrative below the ecosystem comparison.
 *
 * Accepts a fully-resolved {@link SimulatorNarrative} and presents it in
 * three labelled rows inside a single Card, matching the existing reflection
 * panel aesthetic from the dashboard.
 */
export function SimulatorNarrativePanel({ narrative }: SimulatorNarrativePanelProps) {
  return (
    <section
      aria-labelledby="simulator-narrative-heading"
      className="space-y-4"
    >
      {/* Section heading */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-500" aria-hidden="true" />
          <h3
            id="simulator-narrative-heading"
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
          >
            AI What-If Narrative
          </h3>
        </div>
        {narrative.isAiGenerated && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400"
            aria-hidden="true"
          >
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Gemini
          </span>
        )}
      </div>

      {/* Narrative card */}
      <Card className="border-emerald-100 dark:border-emerald-900/40 shadow-md">
        <CardContent className="p-6 space-y-0 divide-y divide-border/40">
          <NarrativeRow
            icon={Eye}
            label="Observation"
            text={narrative.observation}
            accentClass="bg-sky-100 dark:bg-sky-900/30"
            iconClass="text-sky-600 dark:text-sky-400"
          />
          <NarrativeRow
            icon={Leaf}
            label="Environmental Implication"
            text={narrative.implication}
            accentClass="bg-emerald-100 dark:bg-emerald-900/30"
            iconClass="text-emerald-600 dark:text-emerald-400"
          />
          <NarrativeRow
            icon={Lightbulb}
            label="Suggested Action"
            text={narrative.suggestedAction}
            accentClass="bg-amber-100 dark:bg-amber-900/30"
            iconClass="text-amber-600 dark:text-amber-400"
          />
        </CardContent>
      </Card>
    </section>
  )
}

// ============================================================
// Error fallback
// ============================================================

/**
 * Minimal error state shown if the Server Action itself fails
 * (distinct from Gemini failures, which are handled internally).
 */
export function SimulatorNarrativeError({ onRetry }: { onRetry: () => void }) {
  return (
    <section aria-labelledby="simulator-narrative-error-heading">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h3
          id="simulator-narrative-error-heading"
          className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
        >
          AI What-If Narrative
        </h3>
      </div>
      <div
        role="alert"
        className="flex items-start gap-3 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-3"
      >
        <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          The narrative could not be generated right now. Try adjusting the
          simulation parameters to trigger a fresh analysis.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-2"
        >
          <RotateCcw className="mr-2 h-3 w-3" />
          Try Again
        </Button>
      </div>
    </section>
  )
}
