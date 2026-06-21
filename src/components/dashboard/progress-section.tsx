import { LineChart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { TrendSummary } from './trend-summary'
import { RecentActivity } from './recent-activity'
import { EcosystemJourney } from './ecosystem-journey'
import type { DailyEntry, EcosystemState } from '@/types'

interface ProgressSectionProps {
  entries: DailyEntry[]
  ecosystemStates: EcosystemState[]
  firstEcosystem: EcosystemState | null
}

export function ProgressSection({ entries, ecosystemStates, firstEcosystem }: ProgressSectionProps) {
  // Empty State: require at least 2 entries to show meaningful trends
  if (entries.length < 2) {
    return (
      <Card className="border-emerald-200 dark:border-emerald-800/60 shadow-sm border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-10 sm:p-14 text-center">
          <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 p-4 mb-4 text-emerald-600 dark:text-emerald-400">
            <LineChart className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Trends unlock soon
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm leading-relaxed">
            Your progress history, trend summaries, and ecosystem journey will appear here once you log at least two entries. Keep up the great work!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Part B: Trend Summary */}
      <section>
        <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Trend Summary</h3>
        <TrendSummary entries={entries} />
      </section>

      <div className="grid gap-8 lg:grid-cols-2 items-start">
        {/* Part A & C: Recent Activity */}
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Recent Activity</h3>
          <RecentActivity entries={entries} />
        </section>

        {/* Part D: Ecosystem Journey */}
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Ecosystem Journey</h3>
          <EcosystemJourney recentStates={ecosystemStates} firstState={firstEcosystem} />
        </section>
      </div>
    </div>
  )
}
