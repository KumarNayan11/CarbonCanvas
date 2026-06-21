import { ArrowDown, ArrowRight, ArrowUp, Car, Utensils } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { DailyEntry } from '@/types'

interface RecentActivityProps {
  entries: DailyEntry[]
}

export function RecentActivity({ entries }: RecentActivityProps) {
  // We only show the latest 10, but we might need the 11th for the 10th's indicator
  const displayEntries = entries.slice(0, 10)

  return (
    <div className="space-y-3">
      {displayEntries.map((entry, index) => {
        // Compare with the previous day chronologically (which is the next item in this DESC array)
        const previousEntry = entries[index + 1]
        
        let indicator = null

        if (previousEntry) {
          const currentScore = entry.carbon_score
          const prevScore = previousEntry.carbon_score
          const diff = currentScore - prevScore

          if (prevScore === 0) {
             // Avoid division by zero if prev score is exactly 0
             indicator = (
               <span className="flex items-center text-xs font-medium text-muted-foreground">
                 <ArrowRight className="mr-1 h-3 w-3" /> Stable
               </span>
             )
          } else {
            const percentChange = Math.abs((diff / prevScore) * 100).toFixed(0)

            if (diff < -0.1) { // Threshold for "Better" to avoid float noise
              indicator = (
                <span className="flex items-center text-xs font-medium text-green-600 dark:text-green-400">
                  <ArrowDown className="mr-1 h-3 w-3" /> {percentChange}% Better
                </span>
              )
            } else if (diff > 0.1) {
              indicator = (
                <span className="flex items-center text-xs font-medium text-red-600 dark:text-red-400">
                  <ArrowUp className="mr-1 h-3 w-3" /> {percentChange}% Higher Impact
                </span>
              )
            } else {
              indicator = (
                <span className="flex items-center text-xs font-medium text-muted-foreground">
                  <ArrowRight className="mr-1 h-3 w-3" /> Stable
                </span>
              )
            }
          }
        }

        const dateFormatted = new Date(entry.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        })

        return (
          <Card key={entry.id} className="border-emerald-100 dark:border-emerald-900/40 shadow-sm transition-colors hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                  <span className="text-sm font-bold leading-none">{entry.carbon_score.toFixed(0)}</span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{dateFormatted}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 capitalize">
                      <Car className="h-3 w-3" /> {entry.transport_type || 'None'}
                    </span>
                    <span className="flex items-center gap-1 capitalize">
                      <Utensils className="h-3 w-3" /> {entry.food_type || 'None'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="sm:text-right flex items-center sm:items-end justify-between sm:flex-col gap-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {entry.carbon_score.toFixed(1)} <span className="text-muted-foreground text-xs font-normal">kg CO₂e</span>
                </p>
                {indicator}
              </div>

            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
