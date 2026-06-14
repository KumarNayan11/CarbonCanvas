import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import {
  Leaf,
  LogOut,
  User,
  Mail,
  Calendar,
  Shield,
  TreePine,
  Droplets,
  Wind,
  Sprout,
  Activity,
  Flame,
} from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import { calculateOverallHealth } from '@/services/ecosystem-engine'
import { CarbonEntryForm } from '@/components/carbon/carbon-entry-form'
import { EcosystemCanvas } from '@/components/ecosystem/ecosystem-canvas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
}

/** A single stat card in the metrics grid. */
function MetricCard({ label, value, unit, icon, empty, accentClass }: MetricCardProps) {
  return (
    <Card className="border-emerald-100 dark:border-emerald-900/40 shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs font-medium uppercase tracking-wide">
            {label}
          </CardDescription>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${accentClass ?? 'bg-emerald-100 dark:bg-emerald-900/30'}`}
            aria-hidden="true"
          >
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {empty ? (
          <p className="text-sm text-muted-foreground italic">Log your first activity</p>
        ) : (
          <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {value}
            {unit && (
              <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
            )}
          </p>
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
  const [profileResult, latestEntryResult, latestEcosystemResult] = await Promise.all([
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
  ])

  const profile = profileResult.data
  const latestEntry = latestEntryResult.data   // null when no entries yet
  const latestEcosystem = latestEcosystemResult.data  // null when no snapshots yet

  // ----------------------------------------------------------
  // 3. Derived display values
  // ----------------------------------------------------------
  const displayName = profile?.full_name ?? user.email ?? 'Explorer'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Explorer'

  const joinedAt = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown'

  // Compute overall health via service layer (avoids duplicating the avg formula)
  const overallHealth = latestEcosystem
    ? calculateOverallHealth({
        forestHealth: latestEcosystem.forest_health,
        waterQuality: latestEcosystem.water_quality,
        airQuality: latestEcosystem.air_quality,
        biodiversity: latestEcosystem.biodiversity,
      })
    : null

  const hasData = latestEntry !== null

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

            {/* Sign-out action — wrapped in a <nav> so it appears in landmark navigation */}
            <nav aria-label="Account actions">
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
            Welcome back, {firstName} 🌿
          </h1>
          <p className="mt-1 text-muted-foreground">
            {hasData
              ? 'Here\'s your latest environmental snapshot. Log today\'s activity below.'
              : 'Start tracking your carbon footprint below — your ecosystem will grow with every entry.'}
          </p>
        </div>

        {/* ── Main grid: form + profile ───────────────────── */}
        <div className="grid gap-8 lg:grid-cols-3">

          {/* Carbon Entry Form — spans 2 cols on large screens */}
          <div className="lg:col-span-2">
            <CarbonEntryForm />
          </div>

          {/* Profile card */}
          <Card className="border-emerald-100 dark:border-emerald-900/40 shadow-md h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                Your Profile
              </CardTitle>
              <CardDescription>Account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar — decorative initial; name is announced by the adjacent <p> */}
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-lg font-bold shadow-md shrink-0"
                  aria-hidden="true"
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p
                    className="font-semibold text-gray-900 dark:text-gray-100 truncate"
                    aria-label={`Logged in as ${displayName}`}
                  >
                    {displayName}
                  </p>
                  <p className="text-sm text-muted-foreground">CarbonCanvas Member</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                  <span className="text-muted-foreground truncate">
                    {profile?.email ?? user.email}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                  <span className="text-muted-foreground">Joined {joinedAt}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    Session verified
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Ecosystem visualization ─────────────────────── */}
        <section aria-labelledby="ecosystem-heading">
          <h2
            id="ecosystem-heading"
            className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            Your Ecosystem
          </h2>

          <Card className="border-emerald-100 dark:border-emerald-900/40 shadow-md overflow-hidden">
            <CardContent className="p-0">
              {latestEcosystem ? (
                <EcosystemCanvas
                  forestHealth={latestEcosystem.forest_health}
                  waterQuality={latestEcosystem.water_quality}
                  airQuality={latestEcosystem.air_quality}
                  biodiversity={latestEcosystem.biodiversity}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
                    <Sprout className="h-7 w-7 text-emerald-500" aria-hidden="true" />
                  </div>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Log your first activity to bring your ecosystem to life.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ── Metrics section ─────────────────────────────── */}
        {/*
         * aria-live="polite" ensures screen readers announce metric updates
         * after a successful form submission without interrupting the user.
         * WCAG 2.1 SC 4.1.3 — Status Messages (Level AA)
         */}
        <section aria-labelledby="metrics-heading" aria-live="polite" aria-atomic="false">
          <h2
            id="metrics-heading"
            className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            Today&apos;s snapshot
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* Carbon Score */}
            <MetricCard
              label="Carbon score"
              value={latestEntry?.carbon_score ?? 0}
              unit="kg CO₂e"
              empty={!hasData}
              accentClass="bg-orange-100 dark:bg-orange-900/30"
              icon={<Flame className="h-4 w-4 text-orange-500" />}
            />

            {/* Overall Health */}
            <MetricCard
              label="Overall health"
              value={overallHealth ?? 0}
              unit="/ 100"
              empty={!latestEcosystem}
              accentClass="bg-emerald-100 dark:bg-emerald-900/30"
              icon={<Activity className="h-4 w-4 text-emerald-600" />}
            />

            {/* Forest Health */}
            <MetricCard
              label="Forest health"
              value={latestEcosystem?.forest_health ?? 0}
              unit="/ 100"
              empty={!latestEcosystem}
              accentClass="bg-green-100 dark:bg-green-900/30"
              icon={<TreePine className="h-4 w-4 text-green-600" />}
            />

            {/* Water Quality */}
            <MetricCard
              label="Water quality"
              value={latestEcosystem?.water_quality ?? 0}
              unit="/ 100"
              empty={!latestEcosystem}
              accentClass="bg-blue-100 dark:bg-blue-900/30"
              icon={<Droplets className="h-4 w-4 text-blue-500" />}
            />

            {/* Air Quality */}
            <MetricCard
              label="Air quality"
              value={latestEcosystem?.air_quality ?? 0}
              unit="/ 100"
              empty={!latestEcosystem}
              accentClass="bg-sky-100 dark:bg-sky-900/30"
              icon={<Wind className="h-4 w-4 text-sky-500" />}
            />

            {/* Biodiversity */}
            <MetricCard
              label="Biodiversity"
              value={latestEcosystem?.biodiversity ?? 0}
              unit="/ 100"
              empty={!latestEcosystem}
              accentClass="bg-teal-100 dark:bg-teal-900/30"
              icon={<Sprout className="h-4 w-4 text-teal-600" />}
            />

          </div>
        </section>

      </main>
    </div>
  )
}
