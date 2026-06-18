'use client'

import { useState, useMemo, useEffect, useTransition, useRef } from 'react'
import { MoveRight, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { simulateImpact } from '@/services/impact-simulator'
import { EcosystemComparison } from '@/components/ecosystem/ecosystem-comparison'
import {
  SimulatorNarrativePanel,
  SimulatorNarrativeSkeleton,
  SimulatorNarrativeError,
} from '@/components/carbon/simulator-narrative-panel'
import { generateSimulationNarrative } from '@/app/actions/simulator'
import type { DailyEntry } from '@/types'
import type { TransportType, FoodType } from '@/services/carbon-calculator'
import type { SimulationChanges } from '@/services/impact-simulator'
import type { SimulatorNarrative } from '@/services/simulator-narrative'

// ============================================================
// Sub-components
// ============================================================


/** Displays a single metric's projection */
function MetricProjection({
  label,
  current,
  projected,
  improvement,
  unit = '',
  invertColors = false,
}: {
  label: string
  current: number
  projected: number
  improvement: number
  unit?: string
  invertColors?: boolean
}) {
  // If invertColors is true, lower is better (e.g., carbon score).
  // If invertColors is false, higher is better (e.g., forest health).
  const isBetter = invertColors ? improvement > 0 : improvement > 0
  const isWorse = invertColors ? improvement < 0 : improvement < 0
  const isNeutral = improvement === 0

  let colorClass = 'text-muted-foreground'
  let Icon = Minus
  if (isBetter) {
    colorClass = 'text-emerald-600 dark:text-emerald-400'
    Icon = TrendingUp
  } else if (isWorse) {
    colorClass = 'text-red-600 dark:text-red-400'
    Icon = TrendingDown
  }

  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-card p-3 shadow-sm">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          <span>
            {current}
            {unit}
          </span>
          <MoveRight className="h-3 w-3" />
          <span className="font-medium text-foreground">
            {projected}
            {unit}
          </span>
        </div>
      </div>
      <div className={`flex items-center gap-1.5 font-semibold ${colorClass}`}>
        {!isNeutral && <Icon className="h-4 w-4" />}
        <span>
          {improvement > 0 ? '+' : ''}
          {improvement}
          {unit}
        </span>
      </div>
    </div>
  )
}

// ============================================================
// Main Component
// ============================================================

/**
 * Narrative state machine:
 * - 'idle'    → initial state, no narrative yet
 * - 'loading' → Server Action in flight
 * - 'ready'   → narrative received and displayed
 * - 'error'   → Server Action returned an error
 */
type NarrativeState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; narrative: SimulatorNarrative }
  | { status: 'error' }

export function SimulatorClient({ initialEntry }: { initialEntry: DailyEntry }) {
  // We initialize the form state to match the initial entry exactly.
  // Using empty strings for nulls ensures inputs are controlled.
  const [transportType, setTransportType] = useState<string>(initialEntry.transport_type ?? '')
  const [transportDistanceKm, setTransportDistanceKm] = useState<string>(
    initialEntry.transport_distance_km?.toString() ?? '',
  )
  const [foodType, setFoodType] = useState<string>(initialEntry.food_type ?? '')
  const [energyUsageKwh, setEnergyUsageKwh] = useState<string>(
    initialEntry.energy_usage_kwh?.toString() ?? '',
  )
  const [shoppingItems, setShoppingItems] = useState<string>(
    initialEntry.shopping_items?.toString() ?? '',
  )

  // Narrative state
  const [narrativeState, setNarrativeState] = useState<NarrativeState>({ status: 'idle' })
  const [, startTransition] = useTransition()

  // Debounce ref — we wait 900ms after the last input change before calling
  // the Server Action, so rapid typing doesn't hammer the Gemini API.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Use useMemo to compute the simulation result whenever inputs change.
  // This keeps the UI completely reactive without needing a "Run" button.
  const simulation = useMemo(() => {
    // Parse strings back into the typed SimulationChanges object
    const changes: SimulationChanges = {}

    if (transportType) changes.transport_type = transportType as TransportType
    if (transportDistanceKm !== '') changes.transport_distance_km = Number(transportDistanceKm)
    if (foodType) changes.food_type = foodType as FoodType
    if (energyUsageKwh !== '') changes.energy_usage_kwh = Number(energyUsageKwh)
    if (shoppingItems !== '') changes.shopping_items = Number(shoppingItems)

    return simulateImpact(initialEntry, changes)
  }, [initialEntry, transportType, transportDistanceKm, foodType, energyUsageKwh, shoppingItems])

  // ── Narrative generation ─────────────────────────────────
  // Trigger a debounced Server Action call whenever the simulation changes.
  // Uses useEffect so the narrative update is always async and never blocks
  // the synchronous simulation rendering.
  //
  // The loading state is set inside the setTimeout callback (not synchronously)
  // to comply with the react-hooks/set-state-in-effect lint rule.
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      // Mark as loading only when the debounce period has elapsed
      setNarrativeState({ status: 'loading' })

      startTransition(async () => {
        try {
          const result = await generateSimulationNarrative({
            currentCarbonScore: simulation.currentCarbonScore,
            projectedCarbonScore: simulation.projectedCarbonScore,
            carbonReduction: simulation.carbonReduction,
            reductionPercentage: simulation.reductionPercentage,
            ecosystemImprovement: simulation.ecosystemImprovement,
          })

          if (result.success) {
            setNarrativeState({ status: 'ready', narrative: result.narrative })
          } else {
            setNarrativeState({ status: 'error' })
          }
        } catch {
          setNarrativeState({ status: 'error' })
        }
      })
    }, 900)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [simulation])

  return (
    <div className="space-y-8">
      {/* ── 1. Form ────────────────────────────────────────── */}
      <Card className="border border-emerald-100 dark:border-emerald-900/50 shadow-xl shadow-emerald-900/5">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl font-semibold">Simulation Parameters</CardTitle>
          <CardDescription className="text-muted-foreground">
            Tweak your daily activities to see how they impact your footprint and ecosystem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* ── Transport section ────────────────────────── */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Transport</h3>
              <div className="space-y-2">
                <Label htmlFor="transportType">Transport type</Label>
                <select
                  id="transportType"
                  value={transportType}
                  onChange={(e) => setTransportType(e.target.value)}
                  aria-describedby="transportType-hint"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500"
                >
                  <option value="" disabled>Select a mode of transport…</option>
                  <option value="car">🚗 Car</option>
                  <option value="bus">🚌 Bus</option>
                  <option value="train">🚆 Train</option>
                  <option value="bicycle">🚲 Bicycle</option>
                  <option value="walking">🚶 Walking</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transportDistanceKm">Distance (km)</Label>
                <Input
                  id="transportDistanceKm"
                  type="number"
                  min={0}
                  step={0.1}
                  placeholder="0.0"
                  value={transportDistanceKm}
                  onChange={(e) => setTransportDistanceKm(e.target.value)}
                  aria-describedby="transportDistanceKm-hint"
                  className="transition-all duration-200 focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </div>

            {/* ── Food section ─────────────────────────────── */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Food</h3>
              <div className="space-y-2">
                <Label htmlFor="foodType">Diet type</Label>
                <select
                  id="foodType"
                  value={foodType}
                  onChange={(e) => setFoodType(e.target.value)}
                  aria-describedby="foodType-hint"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500"
                >
                  <option value="" disabled>Select your diet…</option>
                  <option value="vegetarian">🥗 Vegetarian</option>
                  <option value="mixed">🍽️ Mixed</option>
                  <option value="meat">🥩 Meat-heavy</option>
                </select>
              </div>
            </div>

            {/* ── Energy section ───────────────────────────── */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Energy</h3>
              <div className="space-y-2">
                <Label htmlFor="energyUsageKwh">Energy usage (kWh)</Label>
                <Input
                  id="energyUsageKwh"
                  type="number"
                  min={0}
                  step={0.1}
                  placeholder="0.0"
                  value={energyUsageKwh}
                  onChange={(e) => setEnergyUsageKwh(e.target.value)}
                  aria-describedby="energyUsageKwh-hint"
                  className="transition-all duration-200 focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </div>

            {/* ── Shopping section ─────────────────────────── */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Shopping</h3>
              <div className="space-y-2">
                <Label htmlFor="shoppingItems">Shopping items</Label>
                <Input
                  id="shoppingItems"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="0"
                  value={shoppingItems}
                  onChange={(e) => setShoppingItems(e.target.value)}
                  aria-describedby="shoppingItems-hint"
                  className="transition-all duration-200 focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Ecosystem Comparison (Visual) ───────────────── */}
      <EcosystemComparison
        currentEcosystem={simulation.currentEcosystem}
        projectedEcosystem={simulation.projectedEcosystem}
        ecosystemImprovement={simulation.ecosystemImprovement}
      />

      {/* ── 3. AI What-If Narrative ─────────────────────────
       *
       * Displayed directly below the ecosystem comparison section.
       * The narrative is generated server-side (Gemini or fallback)
       * and never written to the database.
       *
       * WCAG 2.1 SC 4.1.3 — Status Messages (Level AA)
       * aria-live="polite" on the wrapper announces narrative updates
       * to screen readers without interrupting the user.
       */}
      <div aria-live="polite" aria-atomic="true">
        {narrativeState.status === 'loading' && <SimulatorNarrativeSkeleton />}
        {narrativeState.status === 'ready' && (
          <SimulatorNarrativePanel narrative={narrativeState.narrative} />
        )}
        {narrativeState.status === 'error' && <SimulatorNarrativeError />}
        {/* 'idle' renders nothing — panel appears after first simulation change */}
      </div>

      {/* ── 4. Numerical Metrics ───────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Carbon Impact Card */}
        <Card className="border-orange-100 dark:border-orange-900/40 shadow-md">
          <CardHeader>
            <CardTitle>Carbon Impact</CardTitle>
            <CardDescription>How this scenario changes your footprint.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetricProjection
              label="Total Carbon Footprint"
              current={simulation.currentCarbonScore}
              projected={simulation.projectedCarbonScore}
              improvement={simulation.carbonReduction}
              unit="kg"
            />
            {simulation.reductionPercentage !== null && simulation.reductionPercentage !== 0 && (
              <p className="text-sm text-muted-foreground text-right mt-2">
                That is a <span className="font-semibold text-foreground">{Math.abs(simulation.reductionPercentage)}%</span>{' '}
                {simulation.reductionPercentage > 0 ? 'reduction' : 'increase'}.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Ecosystem Impact Card */}
        <Card className="border-emerald-100 dark:border-emerald-900/40 shadow-md">
          <CardHeader>
            <CardTitle>Ecosystem Metrics</CardTitle>
            <CardDescription>Detailed breakdown of your virtual world&apos;s health.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetricProjection
              label="Forest Health"
              current={simulation.currentEcosystem.forestHealth}
              projected={simulation.projectedEcosystem.forestHealth}
              improvement={simulation.ecosystemImprovement.forestHealth}
            />
            <MetricProjection
              label="Water Quality"
              current={simulation.currentEcosystem.waterQuality}
              projected={simulation.projectedEcosystem.waterQuality}
              improvement={simulation.ecosystemImprovement.waterQuality}
            />
            <MetricProjection
              label="Air Quality"
              current={simulation.currentEcosystem.airQuality}
              projected={simulation.projectedEcosystem.airQuality}
              improvement={simulation.ecosystemImprovement.airQuality}
            />
            <MetricProjection
              label="Biodiversity"
              current={simulation.currentEcosystem.biodiversity}
              projected={simulation.projectedEcosystem.biodiversity}
              improvement={simulation.ecosystemImprovement.biodiversity}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
