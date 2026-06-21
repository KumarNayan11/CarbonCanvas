'use client'

import { useState } from 'react'
import { Plus, Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { GuidedEntryForm } from '@/components/carbon/guided-entry-form'

// ============================================================
// Props
// ============================================================

export interface GuidedEntryDialogProps {
  /** Whether today's entry already exists. */
  hasTodayEntry: boolean
  /** Existing entry data for pre-filling. */
  todayEntry?: {
    transport_type: string | null
    transport_distance_km: number | null
    food_type: string | null
    energy_usage_kwh: number | null
    shopping_items: number | null
  }
  /** Current ecosystem state for computing deltas. */
  currentEcosystem?: {
    forestHealth: number
    waterQuality: number
    airQuality: number
    biodiversity: number
  }
}

// ============================================================
// Dialog wrapper
// ============================================================

export function GuidedEntryDialog({
  hasTodayEntry,
  todayEntry,
  currentEcosystem,
}: GuidedEntryDialogProps) {
  const [open, setOpen] = useState(false)

  function handleClose() {
    setOpen(false)
    // Trigger a full page reload to pick up revalidated data from the server action
    window.location.reload()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Log Today&apos;s Impact
        </Button>
      </DialogTrigger>

      <DialogContent
        data-slot="dialog-content"
        className="max-w-lg max-h-[85vh] overflow-y-auto sm:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Leaf className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            {hasTodayEntry ? 'Updating today\u2019s impact' : 'Log today\u2019s impact'}
          </DialogTitle>
          <DialogDescription>
            {hasTodayEntry
              ? 'Your previous entry will be replaced with these new selections.'
              : 'Select your choices for each category. Watch the live preview update in real time.'}
          </DialogDescription>
        </DialogHeader>

        <GuidedEntryForm
          hasTodayEntry={hasTodayEntry}
          todayEntry={todayEntry}
          currentEcosystem={currentEcosystem}
          onClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  )
}

/**
 * Standalone trigger button for use in the dashboard header.
 * This is a thin convenience export that just renders the full dialog.
 */
export { GuidedEntryDialog as GuidedEntryTrigger }
