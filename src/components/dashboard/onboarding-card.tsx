import { 
  Sprout, 
  FlaskConical, 
  Leaf,
  ArrowUp
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export function OnboardingCard() {
  return (
    <Card className="border-emerald-200 dark:border-emerald-800/60 shadow-lg bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 overflow-hidden mb-8">
      <CardHeader className="pb-4 bg-emerald-100/50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-900/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Leaf className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-xl">Your journey starts here</CardTitle>
            <CardDescription className="text-base mt-1">
              CarbonCanvas translates your daily choices into a living, breathing virtual ecosystem.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="grid md:grid-cols-3 gap-8 md:gap-4 lg:gap-8 relative">
          
          {/* Step 1 */}
          <div className="flex flex-col relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-xs font-bold text-emerald-700 dark:text-emerald-400">1</span>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">Log activities</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed pl-9">
              Tap the <strong className="text-emerald-700 dark:text-emerald-400">+ Log Today&apos;s Impact</strong> button in the header to record your transport, food, energy, and consumption choices.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-xs font-bold text-emerald-700 dark:text-emerald-400">2</span>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">Grow ecosystem</h3>
            </div>
            <div className="flex items-start gap-2 pl-9">
              <Sprout className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Watch your unique ecosystem flourish. Low-carbon choices grow forests, clear the air, and clean the water.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-xs font-bold text-emerald-700 dark:text-emerald-400">3</span>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">Explore simulator</h3>
            </div>
            <div className="flex items-start gap-2 pl-9">
              <FlaskConical className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Unlock the Simulator to test "what-if" scenarios. See how a plant-based diet or biking would impact your world.
              </p>
            </div>
          </div>
          
        </div>

        <div className="mt-8 pt-6 border-t border-emerald-100 dark:border-emerald-900/30 flex justify-center">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <ArrowUp className="h-4 w-4 animate-bounce" aria-hidden="true" />
            Start by tapping the green button above
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
