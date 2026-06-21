import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Leaf,
  LogOut,
  TreePine,
  Droplets,
  Wind,
  Sprout,
  Activity,
  Flame,
  ArrowRight,
  FlaskConical,
} from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import { calculateOverallHealth } from '@/services/ecosystem-engine'
import { calculateStreaks } from '@/services/streak-calculator'
import { GuidedEntryDialog } from '@/components/carbon/guided-entry-dialog'
import { StreakCard } from '@/components/carbon/streak-card'
import { OnboardingCard } from '@/components/dashboard/onboarding-card'
import { EcosystemCanvas } from '@/components/ecosystem/ecosystem-canvas'
import { EcosystemStatusBadges } from '@/components/ecosystem/ecosystem-status-badges'
import { EcosystemReflectionPanel } from '@/components/ecosystem/ecosystem-reflection-panel'
import { ProgressSection } from '@/components/dashboard/progress-section'
import { AchievementsSection } from '@/components/dashboard/achievements-section'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { Profile, DailyEntry, EcosystemState } from '@/types'

export const metadata: Metadata = {
  title: 'Dashboard — CarbonCanvas',
  description: 'Your personal carbon footprint dashboard.',
}

// ============================================================
// Sub-components (Server-side, purely presentational)
// ============================================================

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  icon: React.ReactNode
  /** Whether this card is in an "empty" / placeholder state */
  empty?: boolean
  /** Optional colour accent class applied to the icon wrapper */
  accentClass?: string
  /**
   * When provided, renders a Progress bar below the value.
   * Must be a number in [0, 100]. Omit for metrics not on a /100 scale
   * (e.g. Carbon score in kg CO₂e).
   */
  progressValue?: number
  /**
   * Tailwind class(es) that override the progress indicator colour.
   * Uses the `[&_[data-slot=progress-indicator]]:` arbitrary variant so we
   * can colour each bar independently without touching the shared primitive.
   *
   * @example "[&_[data-slot=progress-indicator]]:bg-emerald-500"
   */
  progressClass?: string
  /**
   * Short hint shown in the empty state in place of the value.
   * Should be a single phrase telling the user what will appear here.
   */
  emptyHint?: string
}

/** A single stat card in the metrics grid. */
function MetricCard({ label, value, unit, icon, empty, accentClass, progressValue, progressClass, emptyHint }: MetricCardProps) {
  // Clamp progressValue to [0, 100] so malformed data never breaks the bar.
  const clampedProgress =
    progressValue !== undefined
      ? Math.min(100, Math.max(0, Math.round(progressValue)))
      : undefined

  return (
    <Card className="border-emerald-100 dark:border-emerald-900/40 shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs font-medium uppercase tracking-wide">
            {label}
          </CardDescription>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              empty
                ? 'bg-muted/60 dark:bg-muted/30'
                : (accentClass ?? 'bg-emerald-100 dark:bg-emerald-900/30')
            }`}
            aria-hidden="true"
          >
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {empty ? (
          /*
           * Empty placeholder: a dashed box with a short context-specific hint.
           * The dashed border signals "something will appear here" without
           * using colour as the only indicator (WCAG 1.4.1).
           */
          <div
            className="rounded-lg border border-dashed border-muted-foreground/25 px-3 py-3 text-center"
            aria-label={`${label}: no data yet. ${emptyHint ?? 'Log an entry to see this metric.'}`}
          >
            <p className="text-xs text-muted-foreground/70 leading-snug">
              {emptyHint ?? 'Log an entry to see this metric.'}
            </p>
          </div>
        ) : (
          <>
            {/* Numeric value */}
            <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {value}
              {unit && (
                <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
              )}
            </p>

            {/* Progress bar — only shown for /100 metrics */}
            {clampedProgress !== undefined && (
              <div className="space-y-1">
                <Progress
                  value={clampedProgress}
                  className={[
                    'h-1.5',
                    progressClass,
                  ].filter(Boolean).join(' ')}
                  /*
                   * WCAG 2.1 SC 4.1.2 — Name, Role, Value (Level A)
                   * Radix ProgressPrimitive.Root already sets role="progressbar",
                   * aria-valuemin, aria-valuemax, and aria-valuenow internally.
                   * We add aria-label so the bar has a meaningful accessible name
                   * independent of surrounding text.
                   */
                  aria-label={`${label}: ${clampedProgress} out of 100`}
                />
                {/* Screen-reader-only percentage for extra context */}
                <p className="sr-only">{clampedProgress}% complete</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================
// Page
// ============================================================

/**
 * Dashboard page — Server Component, protected by middleware.
 *
 * Data fetching strategy:
 * - Fetches the user's latest `daily_entries` row (ordered by date DESC).
 * - Fetches the user's latest `ecosystem_states` snapshot (ordered by created_at DESC).
 *   See docs/architecture.md § ADR-001 — ecosystem_states is append-only; the most
 *   recent row represents the current state.
 * - Computes overallHealth via the service layer (no duplicated arithmetic here).
 */
export default async function DashboardPage() {
  const supabase = await createServerClient()

  // ----------------------------------------------------------
  // 1. Auth guard
  // ----------------------------------------------------------
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // ----------------------------------------------------------
  // 2. Parallel data fetching
  // ----------------------------------------------------------
  const [
    profileResult, 
    latestEntryResult, 
    latestEcosystemResult, 
    allEntriesResult, 
    recentEcosystemsResult,
    firstEcosystemResult
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single<Profile>(),

    // Latest daily entry — one row per user per day (UNIQUE constraint)
    supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle<DailyEntry>(),

    // Latest ecosystem snapshot — append-only table; order by created_at DESC
    // See docs/architecture.md § ADR-001
    supabase
      .from('ecosystem_states')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<EcosystemState>(),

    // All entries for history and streak calculation
    supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false }),

    // Recent ecosystem states for the journey timeline
    supabase
      .from('ecosystem_states')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),

    // First ever ecosystem state for journey baseline
    supabase
      .from('ecosystem_states')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle<EcosystemState>(),
  ])

  const profile = profileResult.data
  const latestEntry = latestEntryResult.data   // null when no entries yet
  const latestEcosystem = latestEcosystemResult.data  // null when no snapshots yet
  
  const allEntries: DailyEntry[] = allEntriesResult.data ?? []
  const recentEcosystems: EcosystemState[] = recentEcosystemsResult.data ?? []
  const firstEcosystem: EcosystemState | null = firstEcosystemResult.data

  // Extract date strings; fall back to [] on error (e.g. RLS policy change).
  const entryDates: string[] = allEntries.map((r) => r.date as string)

  // ----------------------------------------------------------
  // 3. Derived display values
  // ----------------------------------------------------------
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Explorer'

  // Compute overall health via service layer (avoids duplicating the avg formula)
  const overallHealth = latestEcosystem
    ? calculateOverallHealth({
        forestHealth: latestEcosystem.forest_health,
        waterQuality: latestEcosystem.water_quality,
        airQuality: latestEcosystem.air_quality,
        biodiversity: latestEcosystem.biodiversity,
      })
    : null

  // Compute streaks from the full entry date history.
  const streaks = calculateStreaks(entryDates)

  const hasData = latestEntry !== null

  // Check if today's entry already exists (for guided dialog messaging)
  const today = new Date().toISOString().split('T')[0]
  const hasTodayEntry = latestEntry?.date === today

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/15 dark:to-cyan-950/20">

      {/* ── Navigation ────────────────────────────────────── */}
      <header className="border-b border-emerald-100 dark:border-emerald-900/30 bg-white/70 dark:bg-black/40 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Site identity — not an interactive nav element, so no <nav> wrapper needed */}
            <div className="flex items-center gap-2.5" role="banner">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600"
                aria-hidden="true"
              >
                <Leaf className="h-4 w-4 text-white" aria-hidden="true" />
              </div>
              <span className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
                CarbonCanvas
              </span>
            </div>

            {/* Navigation actions — wrapped in a <nav> so it appears in landmark navigation */}
            <nav aria-label="Account actions" className="flex items-center gap-3">
              <GuidedEntryDialog
                hasTodayEntry={hasTodayEntry}
                todayEntry={hasTodayEntry ? {
                  transport_type: latestEntry!.transport_type,
                  transport_distance_km: latestEntry!.transport_distance_km,
                  food_type: latestEntry!.food_type,
                  energy_usage_kwh: latestEntry!.energy_usage_kwh,
                  shopping_items: latestEntry!.shopping_items,
                } : undefined}
                currentEcosystem={latestEcosystem ? {
                  forestHealth: latestEcosystem.forest_health,
                  waterQuality: latestEcosystem.water_quality,
                  airQuality: latestEcosystem.air_quality,
                  biodiversity: latestEcosystem.biodiversity,
                } : undefined}
              />
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="gap-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100/50 dark:text-emerald-300 dark:hover:text-emerald-200 dark:hover:bg-emerald-900/30"
              >
                <Link href="/simulator">
                  <FlaskConical className="h-4 w-4" aria-hidden="true" />
                  Simulator
                </Link>
              </Button>
              <form action={signOut}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="gap-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20 transition-all"
                  aria-label="Sign out of CarbonCanvas"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </Button>
              </form>
            </nav>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* ── Welcome header ──────────────────────────────── */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {hasData ? `Welcome back, ${firstName} 🌿` : `Welcome to CarbonCanvas, ${firstName}! 🌱`}
          </h1>
          {hasData && (
            <p className="mt-1 text-muted-foreground">
              Here&apos;s your latest environmental snapshot.
            </p>
          )}
        </div>

        {!hasData && <OnboardingCard />}

        {/* ── 1. Ecosystem Hero ─────────────────────────────── */}
        <section aria-labelledby="ecosystem-heading">
          <h2
            id="ecosystem-heading"
            className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100"
          >
            Your Ecosystem
          </h2>

          <Card className="border-emerald-100 dark:border-emerald-900/40 shadow-md overflow-hidden">
            <CardContent className="p-0">
              {latestEcosystem ? (
                <>
                  <EcosystemCanvas
                    forestHealth={latestEcosystem.forest_health}
                    waterQuality={latestEcosystem.water_quality}
                    airQuality={latestEcosystem.air_quality}
                    biodiversity={latestEcosystem.biodiversity}
                  />
                  <EcosystemStatusBadges
                    forestHealth={latestEcosystem.forest_health}
                    waterQuality={latestEcosystem.water_quality}
                    airQuality={latestEcosystem.air_quality}
                    biodiversity={latestEcosystem.biodiversity}
                  />
                </>
              ) : (
                <div
                  className="flex flex-col items-center gap-6 px-8 py-14 text-center"
                  role="region"
                  aria-label="Ecosystem not yet generated"
                >
                  <div className="relative flex items-center justify-center">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/60 dark:to-teal-950/60 flex items-center justify-center shadow-inner">
                      <Sprout className="h-10 w-10 text-emerald-500" aria-hidden="true" />
                    </div>
                    <div className="absolute h-28 w-28 rounded-full border-2 border-dashed border-emerald-200 dark:border-emerald-800/60" aria-hidden="true" />
                  </div>

                  <div className="space-y-1.5 max-w-sm">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                      Your ecosystem unlocks here
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Once you log your first entry, this canvas will transform into a living representation of your carbon footprint.
                    </p>
                  </div>

                  <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <ArrowRight className="h-4 w-4 rotate-[-90deg]" aria-hidden="true" />
                    Use the green button in the header to log your first entry
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ── 2. Metrics section ────────────────────────────── */}
        <section aria-labelledby="metrics-heading" aria-live="polite" aria-atomic="false">
          <h2
            id="metrics-heading"
            className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            Ecosystem Health Summary
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              label="Carbon score"
              value={latestEntry?.carbon_score ?? 0}
              unit="kg CO₂e"
              empty={!hasData}
              accentClass="bg-orange-100 dark:bg-orange-900/30"
              icon={<Flame className="h-4 w-4 text-orange-500" />}
              emptyHint="Your daily kg CO₂e total appears here after your first entry."
            />
            <MetricCard
              label="Overall health"
              value={overallHealth ?? 0}
              unit="/ 100"
              empty={!latestEcosystem}
              accentClass="bg-emerald-100 dark:bg-emerald-900/30"
              icon={<Activity className="h-4 w-4 text-emerald-600" />}
              progressValue={overallHealth ?? 0}
              progressClass="[&_[data-slot=progress-indicator]]:bg-emerald-500"
              emptyHint="Your composite ecosystem health score will appear here."
            />
            <MetricCard
              label="Forest health"
              value={latestEcosystem?.forest_health ?? 0}
              unit="/ 100"
              empty={!latestEcosystem}
              accentClass="bg-green-100 dark:bg-green-900/30"
              icon={<TreePine className="h-4 w-4 text-green-600" />}
              progressValue={latestEcosystem?.forest_health ?? 0}
              progressClass="[&_[data-slot=progress-indicator]]:bg-green-500"
              emptyHint="Low-carbon choices grow a denser, greener forest."
            />
            <MetricCard
              label="Water quality"
              value={latestEcosystem?.water_quality ?? 0}
              unit="/ 100"
              empty={!latestEcosystem}
              accentClass="bg-blue-100 dark:bg-blue-900/30"
              icon={<Droplets className="h-4 w-4 text-blue-500" />}
              progressValue={latestEcosystem?.water_quality ?? 0}
              progressClass="[&_[data-slot=progress-indicator]]:bg-blue-500"
              emptyHint="Cleaner energy and transport keep rivers healthy."
            />
            <MetricCard
              label="Air quality"
              value={latestEcosystem?.air_quality ?? 0}
              unit="/ 100"
              empty={!latestEcosystem}
              accentClass="bg-sky-100 dark:bg-sky-900/30"
              icon={<Wind className="h-4 w-4 text-sky-500" />}
              progressValue={latestEcosystem?.air_quality ?? 0}
              progressClass="[&_[data-slot=progress-indicator]]:bg-sky-500"
              emptyHint="Less driving and heating means cleaner, clearer skies."
            />
            <MetricCard
              label="Biodiversity"
              value={latestEcosystem?.biodiversity ?? 0}
              unit="/ 100"
              empty={!latestEcosystem}
              accentClass="bg-teal-100 dark:bg-teal-900/30"
              icon={<Sprout className="h-4 w-4 text-teal-600" />}
              progressValue={latestEcosystem?.biodiversity ?? 0}
              progressClass="[&_[data-slot=progress-indicator]]:bg-teal-500"
              emptyHint="Plant-rich diets and fewer purchases support more wildlife."
            />
          </div>
        </section>

        {/* ── 3. AI Reflection / Insights ─────────────────── */}
        {latestEcosystem && (
          <section aria-labelledby="reflection-heading">
            <h2 id="reflection-heading" className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              AI Insights
            </h2>
            <Card className="border-emerald-100 dark:border-emerald-900/40 shadow-md overflow-hidden">
              <CardContent className="p-0">
                <EcosystemReflectionPanel
                  forestHealth={latestEcosystem.forest_health}
                  waterQuality={latestEcosystem.water_quality}
                  airQuality={latestEcosystem.air_quality}
                  biodiversity={latestEcosystem.biodiversity}
                />
              </CardContent>
            </Card>
          </section>
        )}

        {/* ── 4. Sustainability Streak ────────────────────── */}
        <section aria-labelledby="streak-heading">
          <h2 id="streak-heading" className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Sustainability Streak
          </h2>
          <StreakCard
            currentStreak={streaks.currentStreak}
            longestStreak={streaks.longestStreak}
            hasEntries={entryDates.length > 0}
          />
        </section>

        {/* ── 5. Your Progress (History / Journey) ────────── */}
        <section aria-labelledby="progress-heading">
          <h2 id="progress-heading" className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Your Progress
          </h2>
          <ProgressSection 
            entries={allEntries} 
            ecosystemStates={recentEcosystems}
            firstEcosystem={firstEcosystem}
          />
        </section>

        {/* ── 6. Achievements & Milestones ────────────────── */}
        <section aria-labelledby="achievements-heading">
          <div className="mb-8 mt-12 border-t border-emerald-100 dark:border-emerald-900/30 pt-12">
            <h2 id="achievements-heading" className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Achievements & Milestones
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Track your sustainability journey and unlock rewards based on your impact.
            </p>
          </div>
          <AchievementsSection 
            totalEntries={allEntries.length}
            currentStreak={streaks.currentStreak}
            latestEcosystem={latestEcosystem}
          />
        </section>

      </main>
    </div>
  )
}
