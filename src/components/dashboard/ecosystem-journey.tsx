import { TreePine, Droplets, Wind, Sprout } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { EcosystemState } from '@/types'

interface EcosystemJourneyProps {
  recentStates: EcosystemState[]
  firstState: EcosystemState | null
}

export function EcosystemJourney({ recentStates, firstState }: EcosystemJourneyProps) {
  if (!firstState || recentStates.length === 0) return null

  // Display the latest 5 timeline items (already sorted DESC)
  return (
    <div className="space-y-4">
      {recentStates.map((state, index) => {
        const dateFormatted = new Date(state.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })

        // Compare current state to the first ever recorded snapshot
        const forestDiff = state.forest_health - firstState.forest_health
        const waterDiff = state.water_quality - firstState.water_quality
        const airDiff = state.air_quality - firstState.air_quality
        const bioDiff = state.biodiversity - firstState.biodiversity

        const renderDelta = (diff: number, icon: React.ReactNode, label: string) => {
          if (diff > 0) {
            return (
              <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                <span className="flex items-center text-emerald-600 dark:text-emerald-400">{icon}</span> 
                ↑ +{diff.toFixed(0)} {label}
              </div>
            )
          } else if (diff < 0) {
            return (
              <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                <span className="flex items-center text-emerald-600 dark:text-emerald-400">{icon}</span> 
                ↓ {diff.toFixed(0)} {label}
              </div>
            )
          } else {
            return (
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className="flex items-center text-muted-foreground">{icon}</span> 
                → 0 {label}
              </div>
            )
          }
        }

        return (
          <Card key={state.id} className="border-emerald-100 dark:border-emerald-900/40 shadow-sm relative overflow-hidden">
            {index === 0 && (
              <div className="absolute top-0 right-0 rounded-bl-lg bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Latest Snapshot
              </div>
            )}
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {dateFormatted}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 flex flex-wrap gap-x-6 gap-y-3">
              {renderDelta(forestDiff, <TreePine className="h-3.5 w-3.5" />, 'Forest')}
              {renderDelta(waterDiff, <Droplets className="h-3.5 w-3.5" />, 'Water')}
              {renderDelta(airDiff, <Wind className="h-3.5 w-3.5" />, 'Air')}
              {renderDelta(bioDiff, <Sprout className="h-3.5 w-3.5" />, 'Biodiversity')}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
