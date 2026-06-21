'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface AchievementShareCardProps {
  unlockedCount: number
}

export function AchievementShareCard({ unlockedCount }: AchievementShareCardProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const text = `🌱 I've unlocked ${unlockedCount} achievements building a healthier ecosystem with CarbonCanvas! Join me in tracking our environmental impact.`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard', err)
    }
  }

  if (unlockedCount === 0) return null

  return (
    <Card className="border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 dark:border-emerald-900/40 dark:from-emerald-950/20 dark:to-teal-950/20 shadow-sm">
      <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 flex items-center justify-center sm:justify-start gap-2">
            <span>🌱</span> {unlockedCount} Achievement{unlockedCount !== 1 ? 's' : ''} Unlocked
          </h4>
          <p className="text-sm text-emerald-700/80 dark:text-emerald-300/80 mt-1">
            Building a healthier ecosystem with CarbonCanvas
          </p>
        </div>
        <Button 
          onClick={handleShare}
          variant="secondary"
          className="w-full sm:w-auto gap-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-black/40 dark:hover:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800 transition-all"
        >
          {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          {copied ? 'Copied to clipboard!' : 'Share Progress'}
        </Button>
      </CardContent>
    </Card>
  )
}
