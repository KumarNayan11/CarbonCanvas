/**
 * @file streak-card.tsx
 * @description Displays the user's current and longest sustainability streaks.
 *
 * Server-compatible: no state, no hooks, no browser APIs.
 * All streak logic is in `streak-calculator.ts` — this component only renders.
 */

import { Flame, Trophy, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getStreakMessage } from '@/services/streak-calculator'
import type { StreakResult } from '@/services/streak-calculator'

// ============================================================
// Public interface
// ============================================================

export interface StreakCardProps extends StreakResult {
  /** Whether the user has any entries at all. Controls empty state rendering. */
  hasEntries: boolean
}

// ============================================================
// Sub-components
// ============================================================

interface StatPillProps {
  /** Large number to display prominently. */
  count: number
  /** Short descriptor below the number. */
  label: string
  /** Icon rendered to the left of the count. */
  icon: React.ReactNode
  /** Tailwind colour classes for the pill container. */
  containerClass: string
  /** Tailwind colour class for the count text. */
  countClass: string
}

/**
 * A single stat pill — icon + large count + label.
 * Accessible via `aria-label` on the wrapping `<div>`.
 */
function StatPill({ count, label, icon, containerClass, countClass }: StatPillProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-6 py-4 ${containerClass}`}
      aria-label={`${label}: ${count} ${count === 1 ? 'day' : 'days'}`}
    >
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {icon}
        <span className={`text-3xl font-extrabold tabular-nums leading-none ${countClass}`}>
          {count}
        </span>
      </div>
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

// ============================================================
// Main component
// ============================================================

/**
 * Streak card shown on the dashboard.
 *
 * Renders three states:
 *  1. **Empty** — no entries at all: encouraging call-to-action.
 *  2. **No active streak** — entries exist but streak is broken.
 *  3. **Active streak** — current streak > 0, full stats displayed.
 */
export function StreakCard({ currentStreak, longestStreak, hasEntries }: StreakCardProps) {
  const message = getStreakMessage(currentStreak)

  // Determine the streak indicator colour based on streak length.
  // Mirrors the health-tier colour palette for visual consistency.
  const streakIsActive = currentStreak > 0
  const accentConfig = streakIsActive
    ? currentStreak >= 7
      ? {
          pill: 'bg-teal-50 dark:bg-teal-950/40',
          count: 'text-teal-600 dark:text-teal-400',
          icon: <Flame className="h-5 w-5 text-teal-500" aria-hidden="true" />,
          dot: 'bg-teal-500',
          dotLabel: 'Active streak',
        }
      : {
          pill: 'bg-emerald-50 dark:bg-emerald-950/40',
          count: 'text-emerald-600 dark:text-emerald-400',
          icon: <Flame className="h-5 w-5 text-emerald-500" aria-hidden="true" />,
          dot: 'bg-emerald-500',
          dotLabel: 'Active streak',
        }
    : {
        pill: 'bg-muted/60',
        count: 'text-muted-foreground',
        icon: <Zap className="h-5 w-5 text-muted-foreground" aria-hidden="true" />,
        dot: 'bg-muted-foreground/40',
        dotLabel: 'No active streak',
      }

  return (
    <Card
      className="border-emerald-100 dark:border-emerald-900/40 shadow-md"
      aria-labelledby="streak-card-title"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle
              id="streak-card-title"
              className="flex items-center gap-2 text-base font-semibold"
            >
              {/* Active/inactive dot indicator */}
              <span
                className={`inline-block h-2 w-2 rounded-full ${accentConfig.dot}`}
                aria-hidden="true"
              />
              Sustainability Streak
            </CardTitle>
            <CardDescription className="mt-0.5">
              Consecutive days with a carbon entry
            </CardDescription>
          </div>

          {/* Trophy icon — decorative */}
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30 shrink-0"
            aria-hidden="true"
          >
            <Trophy className="h-5 w-5 text-amber-500" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── Empty state ──────────────────────────────────── */}
        {!hasEntries ? (
          /*
           * Empty state shown on first login — no entries logged yet.
           * Uses a numbered list so the call-to-action is unambiguous
           * even without colour (WCAG 1.4.1 — Use of Color).
           * role="status" so screen readers announce this region politely.
           */
          <div
            className="flex flex-col items-center gap-4 py-3 text-center"
            role="status"
            aria-label="No streak yet — start by logging your first entry"
          >
            {/* Icon cluster: flame behind a dashed circle */}
            <div className="relative flex items-center justify-center">
              <div className="h-14 w-14 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                <Flame className="h-7 w-7 text-amber-400/60" aria-hidden="true" />
              </div>
              <div
                className="absolute h-20 w-20 rounded-full border-2 border-dashed border-amber-200 dark:border-amber-800/50"
                aria-hidden="true"
              />
            </div>

            <div className="space-y-1 max-w-[20ch]">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Your streak starts today
              </p>
              <p className="text-xs text-muted-foreground leading-snug">
                Log an entry each day to build a streak and track your consistency.
              </p>
            </div>

            {/* 2-step guide */}
            <ol className="text-left space-y-2 text-xs w-full max-w-[22ch]" aria-label="How to start a streak">
              {[
                { step: '1', text: 'Log today\'s carbon activity above.' },
                { step: '2', text: 'Come back tomorrow — your streak begins.' },
              ].map(({ step, text }) => (
                <li key={step} className="flex items-start gap-2.5">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-[10px] font-bold text-amber-700 dark:text-amber-400"
                    aria-hidden="true"
                  >
                    {step}
                  </span>
                  <span className="text-muted-foreground pt-0.5 leading-snug">{text}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <>
            {/* ── Stat pills ─────────────────────────────── */}
            {/*
             * Responsive: single column on xs, side-by-side from sm.
             * Both pills are inside a labelled group for screen readers.
             */}
            <div
              className="grid grid-cols-2 gap-3"
              role="group"
              aria-label="Streak statistics"
            >
              <StatPill
                count={currentStreak}
                label="Current"
                icon={accentConfig.icon}
                containerClass={accentConfig.pill}
                countClass={accentConfig.count}
              />
              <StatPill
                count={longestStreak}
                label="Best"
                icon={<Trophy className="h-5 w-5 text-amber-500" aria-hidden="true" />}
                containerClass="bg-amber-50 dark:bg-amber-950/40"
                countClass="text-amber-600 dark:text-amber-400"
              />
            </div>

            {/* ── Motivational message ───────────────────── */}
            {/*
             * role="status" — informational, not urgent.
             * WCAG 2.1 SC 4.1.3 — Status Messages (Level AA)
             */}
            <p
              role="status"
              aria-live="polite"
              className="text-center text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3"
            >
              {message}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
