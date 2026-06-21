import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary'

export interface AchievementCardProps {
  id: string
  title: string
  description: string
  icon: LucideIcon
  rarity: Rarity
  isUnlocked: boolean
  currentValue: number
  targetValue: number
  unit?: string
}

const rarityColors = {
  Common: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  Rare: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
  Epic: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800',
  Legendary: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800',
}

export function AchievementCard({
  title,
  description,
  icon: Icon,
  rarity,
  isUnlocked,
  currentValue,
  targetValue,
  unit = ''
}: AchievementCardProps) {
  const progressPercent = Math.min(100, Math.max(0, (currentValue / targetValue) * 100))

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300",
      isUnlocked 
        ? "border-emerald-200 shadow-md hover:shadow-lg dark:border-emerald-800/60 bg-gradient-to-br from-white to-emerald-50/50 dark:from-black dark:to-emerald-950/20" 
        : "border-dashed border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/20 opacity-80"
    )}>
      <CardContent className="p-5 flex gap-4 items-start">
        <div className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
          isUnlocked 
            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400" 
            : "bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
        )}>
          <Icon className="h-6 w-6" />
        </div>
        
        <div className="flex-1 space-y-2">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h4 className={cn(
                "font-semibold text-base tracking-tight",
                isUnlocked ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"
              )}>
                {title}
              </h4>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                isUnlocked ? rarityColors[rarity] : "bg-transparent border-gray-200 text-gray-400 dark:border-gray-800 dark:text-gray-600"
              )}>
                {rarity}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          </div>

          {!isUnlocked && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-gray-600 dark:text-gray-300">
                  {currentValue} / {targetValue} {unit}
                </span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
