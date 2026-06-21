'use client'

import { useState, useMemo, useActionState, useRef, useEffect } from 'react'
import {
  Loader2,
  CheckCircle2,
  Footprints,
  Bike,
  Bus,
  TrainFront,
  Car,
  Leaf,
  TreePine,
  Droplets,
  Wind,
  Sprout,
  Flame,
  Zap,
  ShoppingBag,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { submitCarbonEntry } from '@/app/actions/carbon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { calculateCarbonBreakdown } from '@/services/carbon-calculator'
import { calculateEcosystemState } from '@/services/ecosystem-engine'
import type { CarbonActionState } from '@/app/actions/carbon'
import type { TransportType, FoodType } from '@/services/carbon-calculator'

// ============================================================
// Constants & mappings
// ============================================================

const TRANSPORT_OPTIONS: {
  value: TransportType
  label: string
  icon: React.ReactNode
}[] = [
  { value: 'walking', label: 'Walking', icon: <Footprints className="h-6 w-6" /> },
  { value: 'bicycle', label: 'Bicycle', icon: <Bike className="h-6 w-6" /> },
  { value: 'bus', label: 'Bus', icon: <Bus className="h-6 w-6" /> },
  { value: 'train', label: 'Train', icon: <TrainFront className="h-6 w-6" /> },
  { value: 'car', label: 'Car', icon: <Car className="h-6 w-6" /> },
]

const DISTANCE_PRESETS = [
  { label: 'Short', value: 2, hint: '~2 km' },
  { label: 'Medium', value: 10, hint: '~10 km' },
  { label: 'Long', value: 25, hint: '~25 km' },
]

const FOOD_OPTIONS: {
  value: FoodType
  label: string
  emoji: string
}[] = [
  { value: 'vegetarian', label: 'Plant-based', emoji: '🥗' },
  { value: 'mixed', label: 'Mixed', emoji: '🍽️' },
  { value: 'meat', label: 'Meat-heavy', emoji: '🥩' },
]

const ENERGY_OPTIONS = [
  { value: 'low', label: 'Low', kwh: 5, hint: 'Minimal appliance use', dots: 1 },
  { value: 'medium', label: 'Medium', kwh: 15, hint: 'Typical household use', dots: 2 },
  { value: 'high', label: 'High', kwh: 30, hint: 'Heavy cooling/heating and appliance use', dots: 3 },
]

const CONSUMPTION_OPTIONS = [
  { value: 'nothing', label: 'Nothing purchased', items: 0, emoji: '🚫' },
  { value: 'few', label: '1–2 items', items: 1, emoji: '📦' },
  { value: 'some', label: '3–5 items', items: 4, emoji: '📦' },
  { value: 'many', label: 'Many purchases', items: 7, emoji: '📦' },
]

// Reverse-mapping helpers for pre-filling from existing entry
function reverseMapEnergy(kwh: number | null): string | null {
  if (kwh === null) return null
  if (kwh <= 8) return 'low'
  if (kwh <= 20) return 'medium'
  return 'high'
}

function reverseMapConsumption(items: number | null): string | null {
  if (items === null) return null
  if (items === 0) return 'nothing'
  if (items <= 2) return 'few'
  if (items <= 5) return 'some'
  return 'many'
}

function reverseMapDistance(km: number | null): { preset: number | null; custom: boolean } {
  if (km === null) return { preset: null, custom: false }
  const match = DISTANCE_PRESETS.find((p) => p.value === km)
  if (match) return { preset: match.value, custom: false }
  return { preset: null, custom: true }
}

// ============================================================
// Sub-components
// ============================================================

interface SelectionCardProps {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}

function SelectionCard({ selected, onClick, children, className }: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all duration-200 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
        selected
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 shadow-sm text-emerald-700 dark:text-emerald-300'
          : 'border-muted-foreground/15 hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-muted-foreground',
        className,
      )}
      aria-pressed={selected}
    >
      {children}
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
      {children}
    </h3>
  )
}

// ============================================================
// Props
// ============================================================

export interface GuidedEntryFormProps {
  /** Whether today's entry already exists (controls "updating" vs "new" messaging). */
  hasTodayEntry: boolean
  /** Pre-fill values if today's entry exists. */
  todayEntry?: {
    transport_type: string | null
    transport_distance_km: number | null
    food_type: string | null
    energy_usage_kwh: number | null
    shopping_items: number | null
  }
  /** Current ecosystem state for computing deltas in preview. */
  currentEcosystem?: {
    forestHealth: number
    waterQuality: number
    airQuality: number
    biodiversity: number
  }
  /** Called when the user clicks "Return to Dashboard". */
  onClose: () => void
}

// ============================================================
// Main component
// ============================================================

export function GuidedEntryForm({
  hasTodayEntry,
  todayEntry,
  currentEcosystem,
  onClose,
}: GuidedEntryFormProps) {
  // ── Initial values from existing entry ──
  const initDistance = reverseMapDistance(todayEntry?.transport_distance_km ?? null)

  const [transportType, setTransportType] = useState<TransportType | null>(
    (todayEntry?.transport_type as TransportType) ?? null,
  )
  const [distancePreset, setDistancePreset] = useState<number | null>(initDistance.preset)
  const [useCustomDistance, setUseCustomDistance] = useState(initDistance.custom)
  const [customDistanceValue, setCustomDistanceValue] = useState<string>(
    initDistance.custom && todayEntry?.transport_distance_km != null
      ? String(todayEntry.transport_distance_km)
      : '',
  )
  const [foodType, setFoodType] = useState<FoodType | null>(
    (todayEntry?.food_type as FoodType) ?? null,
  )
  const [energyLevel, setEnergyLevel] = useState<string | null>(
    reverseMapEnergy(todayEntry?.energy_usage_kwh ?? null),
  )
  const [consumptionLevel, setConsumptionLevel] = useState<string | null>(
    reverseMapConsumption(todayEntry?.shopping_items ?? null),
  )

  // ── Submission state ──
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, isPending] = useActionState<CarbonActionState, FormData>(
    submitCarbonEntry,
    undefined,
  )

  // ── Derived values ──
  const isZeroCarbon = transportType === 'walking' || transportType === 'bicycle'
  const showDistance = transportType && !isZeroCarbon

  const effectiveDistance = isZeroCarbon
    ? 0
    : useCustomDistance
      ? (parseFloat(customDistanceValue) || 0)
      : (distancePreset ?? 0)

  const energyKwh = ENERGY_OPTIONS.find((e) => e.value === energyLevel)?.kwh ?? 0
  const shoppingItems = CONSUMPTION_OPTIONS.find((c) => c.value === consumptionLevel)?.items ?? 0

  const isComplete =
    transportType !== null &&
    (isZeroCarbon || distancePreset !== null || (useCustomDistance && parseFloat(customDistanceValue) > 0)) &&
    foodType !== null &&
    energyLevel !== null &&
    consumptionLevel !== null

  // ── Live preview ──
  const preview = useMemo(() => {
    if (!isComplete || !transportType || !foodType) return null

    const input = {
      transportType,
      transportDistanceKm: effectiveDistance,
      foodType,
      energyUsageKwh: energyKwh,
      shoppingItems,
    }

    const breakdown = calculateCarbonBreakdown(input)
    const ecosystem = calculateEcosystemState(breakdown.totalKg)

    // Compute deltas if we have a current ecosystem
    const deltas = currentEcosystem
      ? {
          forest: ecosystem.forestHealth - currentEcosystem.forestHealth,
          water: ecosystem.waterQuality - currentEcosystem.waterQuality,
          air: ecosystem.airQuality - currentEcosystem.airQuality,
          wildlife: ecosystem.biodiversity - currentEcosystem.biodiversity,
        }
      : null

    return { breakdown, ecosystem, deltas }
  }, [isComplete, transportType, effectiveDistance, foodType, energyKwh, shoppingItems, currentEcosystem])

  // ── Success state ──
  const isSuccess = state?.success === true

  // On success, auto-scroll to top of dialog
  useEffect(() => {
    if (isSuccess) {
      const scrollEl = formRef.current?.closest('[data-slot="dialog-content"]')
      scrollEl?.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [isSuccess])

  // ──────────────────────────────────────────────────────────────
  // SUCCESS RESULT CARD
  // ──────────────────────────────────────────────────────────────
  if (isSuccess && preview) {
    return (
      <div className="flex flex-col items-center gap-6 py-4">
        {/* Celebration icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
            {hasTodayEntry ? 'Today\u2019s entry updated' : 'New entry created'}
          </h3>
          <p className="text-sm font-medium text-muted-foreground">
            Your ecosystem has been updated to reflect your choices.
          </p>
        </div>

        {/* Carbon Score */}
        <div className="w-full max-w-sm rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 p-5 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Carbon Score</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            {preview.breakdown.totalKg}
            <span className="ml-1 text-base font-normal text-muted-foreground">kg CO₂e</span>
          </p>
        </div>

        {/* Ecosystem Health */}
        <div className="w-full max-w-sm rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-white/60 dark:bg-black/20 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3 text-center">
            Ecosystem Health
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Forest', value: preview.ecosystem.forestHealth, delta: preview.deltas?.forest, icon: <TreePine className="h-4 w-4 text-green-600" /> },
              { label: 'Water', value: preview.ecosystem.waterQuality, delta: preview.deltas?.water, icon: <Droplets className="h-4 w-4 text-blue-500" /> },
              { label: 'Air', value: preview.ecosystem.airQuality, delta: preview.deltas?.air, icon: <Wind className="h-4 w-4 text-sky-500" /> },
              { label: 'Wildlife', value: preview.ecosystem.biodiversity, delta: preview.deltas?.wildlife, icon: <Sprout className="h-4 w-4 text-teal-600" /> },
            ].map((metric) => (
              <div key={metric.label} className="flex items-center gap-2.5 rounded-lg bg-muted/30 px-3 py-2.5">
                <span aria-hidden="true">{metric.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {metric.value}
                    {metric.delta !== undefined && metric.delta !== null && (
                      <span
                        className={cn(
                          'ml-1.5 text-xs font-medium',
                          metric.delta > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : metric.delta < 0
                              ? 'text-red-500'
                              : 'text-muted-foreground',
                        )}
                      >
                        {metric.delta > 0 ? '+' : ''}{metric.delta}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Return button */}
        <Button
          onClick={onClose}
          className="w-full max-w-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-all"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Dashboard
        </Button>
      </div>
    )
  }

  // ──────────────────────────────────────────────────────────────
  // GUIDED FORM
  // ──────────────────────────────────────────────────────────────
  return (
    <form ref={formRef} action={formAction} className="space-y-6" noValidate>
      {/* Hidden fields for the server action */}
      <input type="hidden" name="transportType" value={transportType ?? ''} />
      <input type="hidden" name="transportDistanceKm" value={effectiveDistance} />
      <input type="hidden" name="foodType" value={foodType ?? ''} />
      <input type="hidden" name="energyUsageKwh" value={energyKwh} />
      <input type="hidden" name="shoppingItems" value={shoppingItems} />

      {/* Server-level error */}
      {state && !state.success && state.message && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400" role="alert">
          {state.message}
        </div>
      )}

      {/* ── 1. Transport ─────────────────────────────────── */}
      <div>
        <SectionLabel>How did you travel today?</SectionLabel>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {TRANSPORT_OPTIONS.map((opt) => (
            <SelectionCard
              key={opt.value}
              selected={transportType === opt.value}
              onClick={() => {
                setTransportType(opt.value)
                // Reset distance when changing transport
                if (opt.value === 'walking' || opt.value === 'bicycle') {
                  setDistancePreset(null)
                  setUseCustomDistance(false)
                  setCustomDistanceValue('')
                }
              }}
            >
              <span aria-hidden="true">{opt.icon}</span>
              <span className="text-xs font-medium leading-tight">{opt.label}</span>
            </SelectionCard>
          ))}
        </div>
      </div>

      {/* ── 2. Distance (motorized transport only) ──────── */}
      {showDistance && (
        <div>
          <SectionLabel>Distance travelled</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DISTANCE_PRESETS.map((preset) => (
              <SelectionCard
                key={preset.value}
                selected={!useCustomDistance && distancePreset === preset.value}
                onClick={() => {
                  setDistancePreset(preset.value)
                  setUseCustomDistance(false)
                }}
              >
                <span className="text-sm font-semibold">{preset.label}</span>
                <span className="text-[11px] text-muted-foreground">{preset.hint}</span>
              </SelectionCard>
            ))}
            <SelectionCard
              selected={useCustomDistance}
              onClick={() => {
                setUseCustomDistance(true)
                setDistancePreset(null)
              }}
            >
              <span className="text-sm font-semibold">Custom</span>
              <span className="text-[11px] text-muted-foreground">Enter km</span>
            </SelectionCard>
          </div>
          {useCustomDistance && (
            <div className="mt-3">
              <Input
                type="number"
                min={0}
                step={0.1}
                placeholder="Distance in km"
                value={customDistanceValue}
                onChange={(e) => setCustomDistanceValue(e.target.value)}
                className="max-w-[180px] transition-all focus:ring-2 focus:ring-emerald-500/40"
                aria-label="Custom distance in kilometres"
                autoFocus
              />
            </div>
          )}
        </div>
      )}

      {/* ── 3. Food ──────────────────────────────────────── */}
      <div>
        <SectionLabel>What did you eat?</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {FOOD_OPTIONS.map((opt) => (
            <SelectionCard
              key={opt.value}
              selected={foodType === opt.value}
              onClick={() => setFoodType(opt.value)}
            >
              <span className="text-2xl" aria-hidden="true">{opt.emoji}</span>
              <span className="text-xs font-medium">{opt.label}</span>
            </SelectionCard>
          ))}
        </div>
      </div>

      {/* ── 4. Energy ────────────────────────────────────── */}
      <div>
        <SectionLabel>Energy usage</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {ENERGY_OPTIONS.map((opt) => (
            <SelectionCard
              key={opt.value}
              selected={energyLevel === opt.value}
              onClick={() => setEnergyLevel(opt.value)}
              className="py-3.5"
            >
              <div className="flex gap-0.5" aria-hidden="true">
                {Array.from({ length: opt.dots }).map((_, i) => (
                  <Zap key={i} className="h-4 w-4" />
                ))}
              </div>
              <span className="text-xs font-semibold">{opt.label}</span>
              <span className="text-[10px] leading-tight text-muted-foreground text-center max-w-[12ch]">
                {opt.hint}
              </span>
            </SelectionCard>
          ))}
        </div>
      </div>

      {/* ── 5. Consumption ───────────────────────────────── */}
      <div>
        <SectionLabel>Consumption today</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CONSUMPTION_OPTIONS.map((opt) => (
            <SelectionCard
              key={opt.value}
              selected={consumptionLevel === opt.value}
              onClick={() => setConsumptionLevel(opt.value)}
            >
              <span className="text-xl" aria-hidden="true">{opt.emoji}</span>
              <span className="text-[11px] font-medium leading-tight text-center">{opt.label}</span>
            </SelectionCard>
          ))}
        </div>
      </div>

      {/* ── Live Impact Preview ───────────────────────────── */}
      {preview && (
        <div className="rounded-xl border-2 border-emerald-200/80 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50/90 to-teal-50/90 dark:from-emerald-950/30 dark:to-teal-950/30 p-5 space-y-4">
          {/* Carbon score */}
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
              Projected Carbon Score
            </p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
              {preview.breakdown.totalKg}
              <span className="ml-1 text-base font-normal text-muted-foreground">kg CO₂e</span>
            </p>
          </div>

          {/* Ecosystem health */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2 text-center">
              Projected Ecosystem Health
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Forest', value: preview.ecosystem.forestHealth, delta: preview.deltas?.forest, icon: <TreePine className="h-4 w-4 text-green-600" /> },
                { label: 'Water', value: preview.ecosystem.waterQuality, delta: preview.deltas?.water, icon: <Droplets className="h-4 w-4 text-blue-500" /> },
                { label: 'Air', value: preview.ecosystem.airQuality, delta: preview.deltas?.air, icon: <Wind className="h-4 w-4 text-sky-500" /> },
                { label: 'Wildlife', value: preview.ecosystem.biodiversity, delta: preview.deltas?.wildlife, icon: <Sprout className="h-4 w-4 text-teal-600" /> },
              ].map((metric) => (
                <div key={metric.label} className="flex items-center gap-2 rounded-lg bg-white/60 dark:bg-black/20 px-3 py-2">
                  <span aria-hidden="true">{metric.icon}</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{metric.label}</span>
                    {metric.delta !== undefined && metric.delta !== null && (
                      <span
                        className={cn(
                          'text-xs font-bold',
                          metric.delta > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : metric.delta < 0
                              ? 'text-red-500'
                              : 'text-muted-foreground',
                        )}
                      >
                        {metric.delta > 0 ? '+' : ''}{metric.delta}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Submit ────────────────────────────────────────── */}
      <Button
        type="submit"
        disabled={!isComplete || isPending}
        className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 disabled:opacity-50"
        aria-busy={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Saving…
          </>
        ) : (
          <>
            <Leaf className="mr-2 h-4 w-4" aria-hidden="true" />
            {hasTodayEntry ? 'Update today\u2019s entry' : 'Save today\u2019s entry'}
          </>
        )}
      </Button>
    </form>
  )
}
