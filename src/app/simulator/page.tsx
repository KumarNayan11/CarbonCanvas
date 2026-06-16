import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Leaf, LogOut, ArrowLeft, FlaskConical, LayoutDashboard } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import { SimulatorClient } from '@/components/carbon/simulator-client'
import { Button } from '@/components/ui/button'
import type { DailyEntry } from '@/types'

export const metadata: Metadata = {
  title: 'Simulator — CarbonCanvas',
  description: 'Explore "what-if" lifestyle changes and their impact on your ecosystem.',
}

export default async function SimulatorPage() {
  const supabase = await createServerClient()

  // 1. Auth guard
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // 2. Fetch latest daily entry
  const { data: latestEntry } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle<DailyEntry>()

  const hasData = latestEntry !== null

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/15 dark:to-cyan-950/20">
      {/* ── Navigation ────────────────────────────────────── */}
      <header className="border-b border-emerald-100 dark:border-emerald-900/30 bg-white/70 dark:bg-black/40 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
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

            <nav aria-label="Account actions" className="flex items-center gap-3">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="gap-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100/50 dark:text-emerald-300 dark:hover:text-emerald-200 dark:hover:bg-emerald-900/30"
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                  Dashboard
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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-3">
            Impact Simulator <FlaskConical className="h-8 w-8 text-emerald-600" />
          </h1>
          <p className="mt-1 text-muted-foreground">
            Explore how different choices affect your carbon footprint and virtual ecosystem. These scenarios are purely hypothetical and will not modify your logged data.
          </p>
        </div>

        {/* ── Content ─────────────────────────────────────── */}
        {!hasData ? (
          <div
            className="rounded-xl border border-dashed border-emerald-200 dark:border-emerald-800 bg-white/50 dark:bg-black/20 p-12 text-center"
            role="region"
            aria-label="No data available for simulation"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 mb-4">
              <FlaskConical className="h-8 w-8 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              We need a starting point
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              The simulator requires at least one logged daily entry to establish your baseline carbon footprint. Log your first activity to unlock the simulator!
            </p>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/dashboard" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Return to Dashboard
              </Link>
            </Button>
          </div>
        ) : (
          <SimulatorClient initialEntry={latestEntry} />
        )}
      </main>
    </div>
  )
}
