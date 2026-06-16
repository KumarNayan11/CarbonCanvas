import { EcosystemCanvas } from './ecosystem-canvas'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { EcosystemState } from '@/services/ecosystem-engine'

export interface EcosystemComparisonProps {
  currentEcosystem: EcosystemState
  projectedEcosystem: EcosystemState
  ecosystemImprovement: EcosystemState
}

export function EcosystemComparison({
  currentEcosystem,
  projectedEcosystem,
  ecosystemImprovement,
}: EcosystemComparisonProps) {
  // Generate a derived summary of positive/negative changes
  const improvements: string[] = []

  if (ecosystemImprovement.forestHealth !== 0) {
    improvements.push(`${ecosystemImprovement.forestHealth > 0 ? '+' : ''}${ecosystemImprovement.forestHealth} Forest Health`)
  }
  if (ecosystemImprovement.waterQuality !== 0) {
    improvements.push(`${ecosystemImprovement.waterQuality > 0 ? '+' : ''}${ecosystemImprovement.waterQuality} Water Quality`)
  }
  if (ecosystemImprovement.airQuality !== 0) {
    improvements.push(`${ecosystemImprovement.airQuality > 0 ? '+' : ''}${ecosystemImprovement.airQuality} Air Quality`)
  }
  if (ecosystemImprovement.biodiversity !== 0) {
    improvements.push(`${ecosystemImprovement.biodiversity > 0 ? '+' : ''}${ecosystemImprovement.biodiversity} Biodiversity`)
  }

  const hasChanges = improvements.length > 0

  return (
    <Card className="border-emerald-100 dark:border-emerald-900/50 shadow-lg">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-xl font-semibold">Visual Projection</CardTitle>
        {hasChanges ? (
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mt-1">
            Projected Outcome: {improvements.join(', ')}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">
            No visible changes projected for this scenario.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Baseline */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-center text-muted-foreground">
              Current Baseline
            </h3>
            <div className="rounded-xl ring-2 ring-border/50 overflow-hidden shadow-sm">
              <EcosystemCanvas
                forestHealth={currentEcosystem.forestHealth}
                waterQuality={currentEcosystem.waterQuality}
                airQuality={currentEcosystem.airQuality}
                biodiversity={currentEcosystem.biodiversity}
              />
            </div>
          </div>

          {/* Projected Future */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-center text-foreground">
              Projected Future
            </h3>
            <div className="rounded-xl ring-2 ring-emerald-500/30 overflow-hidden shadow-md">
              <EcosystemCanvas
                forestHealth={projectedEcosystem.forestHealth}
                waterQuality={projectedEcosystem.waterQuality}
                airQuality={projectedEcosystem.airQuality}
                biodiversity={projectedEcosystem.biodiversity}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
