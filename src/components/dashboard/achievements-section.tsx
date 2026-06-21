import { Zap, Target, Star, TreePine, Droplets, Wind, Sprout, TrendingUp, BarChart, Flag, LucideIcon } from 'lucide-react'
import { AchievementCard, Rarity } from './achievement-card'
import { AchievementShareCard } from './achievement-share-card'
import { Progress } from '@/components/ui/progress'
import type { EcosystemState } from '@/types'

type Category = 'Getting Started' | 'Consistency' | 'Ecosystem Health'

interface AchievementDef {
  id: string
  title: string
  description: string
  icon: LucideIcon
  rarity: Rarity
  category: Category
  targetValue: number
  unit: string
  getCurrentValue: (totalEntries: number, currentStreak: number, latestEcosystem: EcosystemState | null) => number
}

const CATALOG: AchievementDef[] = [
  // Getting Started
  {
    id: 'first_step',
    title: 'First Step',
    description: 'Log your very first carbon entry.',
    icon: Flag,
    rarity: 'Common',
    category: 'Getting Started',
    targetValue: 1,
    unit: 'Entry',
    getCurrentValue: (entries) => entries
  },
  {
    id: 'progress_maker',
    title: 'Progress Maker',
    description: 'Log 5 total entries.',
    icon: TrendingUp,
    rarity: 'Rare',
    category: 'Getting Started',
    targetValue: 5,
    unit: 'Entries',
    getCurrentValue: (entries) => entries
  },
  {
    id: 'climate_tracker',
    title: 'Climate Tracker',
    description: 'Log 10 total entries.',
    icon: BarChart,
    rarity: 'Epic',
    category: 'Getting Started',
    targetValue: 10,
    unit: 'Entries',
    getCurrentValue: (entries) => entries
  },
  
  // Consistency
  {
    id: 'consistency_builder',
    title: 'Consistency Builder',
    description: 'Maintain a 3-day logging streak.',
    icon: Target,
    rarity: 'Common',
    category: 'Consistency',
    targetValue: 3,
    unit: 'Days',
    getCurrentValue: (_, streak) => streak
  },
  {
    id: 'momentum',
    title: 'Momentum',
    description: 'Maintain a 7-day logging streak.',
    icon: Zap,
    rarity: 'Epic',
    category: 'Consistency',
    targetValue: 7,
    unit: 'Days',
    getCurrentValue: (_, streak) => streak
  },
  {
    id: 'sustainability_champ',
    title: 'Sustainability Champion',
    description: 'Maintain a 14-day logging streak.',
    icon: Star,
    rarity: 'Legendary',
    category: 'Consistency',
    targetValue: 14,
    unit: 'Days',
    getCurrentValue: (_, streak) => streak
  },

  // Ecosystem Health
  {
    id: 'ecosystem_guardian',
    title: 'Ecosystem Guardian',
    description: 'Reach a Forest Health score of 90 or above.',
    icon: TreePine,
    rarity: 'Legendary',
    category: 'Ecosystem Health',
    targetValue: 90,
    unit: 'Health',
    getCurrentValue: (_, __, eco) => eco?.forest_health ?? 0
  },
  {
    id: 'water_protector',
    title: 'Water Protector',
    description: 'Reach a Water Quality score of 90 or above.',
    icon: Droplets,
    rarity: 'Legendary',
    category: 'Ecosystem Health',
    targetValue: 90,
    unit: 'Quality',
    getCurrentValue: (_, __, eco) => eco?.water_quality ?? 0
  },
  {
    id: 'clean_air_champ',
    title: 'Clean Air Champion',
    description: 'Reach an Air Quality score of 90 or above.',
    icon: Wind,
    rarity: 'Legendary',
    category: 'Ecosystem Health',
    targetValue: 90,
    unit: 'Quality',
    getCurrentValue: (_, __, eco) => eco?.air_quality ?? 0
  },
  {
    id: 'biodiversity_ally',
    title: 'Biodiversity Ally',
    description: 'Reach a Biodiversity score of 90 or above.',
    icon: Sprout,
    rarity: 'Legendary',
    category: 'Ecosystem Health',
    targetValue: 90,
    unit: 'Score',
    getCurrentValue: (_, __, eco) => eco?.biodiversity ?? 0
  }
]

interface AchievementsSectionProps {
  totalEntries: number
  currentStreak: number
  latestEcosystem: EcosystemState | null
}

export function AchievementsSection({ totalEntries, currentStreak, latestEcosystem }: AchievementsSectionProps) {
  // Evaluate all achievements
  const evaluatedAchievements = CATALOG.map(def => {
    const currentValue = def.getCurrentValue(totalEntries, currentStreak, latestEcosystem)
    const isUnlocked = currentValue >= def.targetValue
    const progressPercent = Math.min(100, Math.max(0, (currentValue / def.targetValue) * 100))
    return { ...def, currentValue, isUnlocked, progressPercent }
  })

  const unlockedCount = evaluatedAchievements.filter(a => a.isUnlocked).length
  const totalCount = CATALOG.length
  const totalProgressPercent = (unlockedCount / totalCount) * 100

  // Find the "Next Milestone" (closest to being unlocked but not yet unlocked)
  const lockedAchievements = evaluatedAchievements.filter(a => !a.isUnlocked)
  // Sort by progress percent descending, pick the top one
  const nextMilestone = lockedAchievements.length > 0 
    ? [...lockedAchievements].sort((a, b) => b.progressPercent - a.progressPercent)[0]
    : null

  // Group by category, and within category sort by unlocked first
  const groupedByCategory: Record<Category, typeof evaluatedAchievements> = {
    'Getting Started': [],
    'Consistency': [],
    'Ecosystem Health': []
  }

  evaluatedAchievements.forEach(a => {
    groupedByCategory[a.category].push(a)
  })

  // Sort within categories: unlocked first
  ;(Object.keys(groupedByCategory) as Category[]).forEach(category => {
    groupedByCategory[category].sort((a, b) => {
      if (a.isUnlocked === b.isUnlocked) return 0
      return a.isUnlocked ? -1 : 1
    })
  })

  return (
    <div className="space-y-8 pt-4">
      
      {/* Top Section: Summary & Next Milestone */}
      <div className="grid gap-6 md:grid-cols-2 items-stretch">
        
        {/* Completion Summary */}
        <div className="bg-white dark:bg-black/40 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-6 shadow-sm flex flex-col justify-center">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Achievements Unlocked
          </h3>
          <div className="flex items-end justify-between mb-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {unlockedCount} <span className="text-xl font-medium text-muted-foreground">/ {totalCount}</span>
            </span>
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {totalProgressPercent.toFixed(0)}%
            </span>
          </div>
          <Progress value={totalProgressPercent} className="h-2 [&_[data-slot=progress-indicator]]:bg-emerald-500" />
        </div>

        {/* Next Milestone */}
        {nextMilestone ? (
          <div className="bg-white dark:bg-black/40 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-6 shadow-sm flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 dark:opacity-10 pointer-events-none">
              <nextMilestone.icon className="h-24 w-24" />
            </div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 relative z-10">
              Next Milestone
            </h3>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{nextMilestone.title}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">
                  {nextMilestone.currentValue} / {nextMilestone.targetValue} {nextMilestone.unit}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <nextMilestone.icon className="h-6 w-6" />
              </div>
            </div>
            <Progress value={nextMilestone.progressPercent} className="h-2 mt-4" />
          </div>
        ) : (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
            <Star className="h-8 w-8 text-emerald-500 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">All Mastered!</h3>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
              You&apos;ve unlocked every achievement. Incredible work!
            </p>
          </div>
        )}

      </div>

      <AchievementShareCard unlockedCount={unlockedCount} />

      {/* Achievement Categories */}
      <div className="space-y-12">
        {(Object.entries(groupedByCategory) as [Category, typeof evaluatedAchievements][]).map(([categoryName, items]) => (
          <section key={categoryName}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              {categoryName}
              <span className="text-sm font-normal text-muted-foreground">
                ({items.filter(i => i.isUnlocked).length}/{items.length})
              </span>
            </h3>
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {items.map(item => (
                <AchievementCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  description={item.description}
                  icon={item.icon}
                  rarity={item.rarity}
                  isUnlocked={item.isUnlocked}
                  currentValue={item.currentValue}
                  targetValue={item.targetValue}
                  unit={item.unit}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

    </div>
  )
}
