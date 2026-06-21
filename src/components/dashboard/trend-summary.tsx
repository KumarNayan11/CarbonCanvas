import { Flame, Trophy, Activity, Hash } from 'lucide-react'
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card'
import type { DailyEntry } from '@/types'

interface TrendSummaryProps {
  entries: DailyEntry[]
}

export function TrendSummary({ entries }: TrendSummaryProps) {
  if (entries.length === 0) return null

  const scores = entries.map((e) => e.carbon_score)
  
  const totalEntries = entries.length
  // Using Math.min / max. "Best Day" = lowest carbon score
  const bestDay = Math.min(...scores)
  const highestImpactDay = Math.max(...scores)
  const averageDailyImpact = scores.reduce((a, b) => a + b, 0) / totalEntries

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-emerald-100 dark:border-emerald-900/40 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-xs font-medium uppercase tracking-wide">
              Best Day
            </CardDescription>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <Trophy className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {bestDay.toFixed(1)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">kg CO₂e</span>
          </p>
        </CardContent>
      </Card>

      <Card className="border-emerald-100 dark:border-emerald-900/40 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-xs font-medium uppercase tracking-wide">
              Highest Impact Day
            </CardDescription>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <Flame className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {highestImpactDay.toFixed(1)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">kg CO₂e</span>
          </p>
        </CardContent>
      </Card>

      <Card className="border-emerald-100 dark:border-emerald-900/40 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-xs font-medium uppercase tracking-wide">
              Average Daily Impact
            </CardDescription>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {averageDailyImpact.toFixed(1)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">kg CO₂e</span>
          </p>
        </CardContent>
      </Card>

      <Card className="border-emerald-100 dark:border-emerald-900/40 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-xs font-medium uppercase tracking-wide">
              Total Entries
            </CardDescription>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Hash className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {totalEntries}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
