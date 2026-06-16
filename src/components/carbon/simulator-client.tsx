'use client'

import { useState, useMemo } from 'react'
import { ArrowRight, MoveRight, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { simulateImpact } from '@/services/impact-simulator'
import type { DailyEntry } from '@/types'
import type { TransportType, FoodType } from '@/services/carbon-calculator'
import type { SimulationChanges } from '@/services/impact-simulator'

// ============================================================
// Sub-components
// ============================================================

/** Muted helper text beneath a form field. */
function FieldHint({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="text-xs text-muted-foreground">
      {children}
    </p>
  )
}

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

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* ── Left Column: Form ────────────────────────────── */}
      <Card className="border border-emerald-100 dark:border-emerald-900/50 shadow-xl shadow-emerald-900/5 h-fit">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl font-semibold">Simulation Parameters</CardTitle>
          <CardDescription className="text-muted-foreground">
            Tweak your daily activities to see how they impact your footprint and ecosystem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* ── Transport section ────────────────────────── */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-foreground">Transport</legend>

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
                <FieldHint id="transportType-hint">Hypothetical primary transport.</FieldHint>
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
                <FieldHint id="transportDistanceKm-hint">Hypothetical distance travelled.</FieldHint>
              </div>
            </fieldset>

            {/* ── Food section ─────────────────────────────── */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-foreground">Food</legend>

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
                <FieldHint id="foodType-hint">Hypothetical diet type.</FieldHint>
              </div>
            </fieldset>

            {/* ── Energy section ───────────────────────────── */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-foreground">Energy</legend>

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
                <FieldHint id="energyUsageKwh-hint">Hypothetical household electricity usage.</FieldHint>
              </div>
            </fieldset>

            {/* ── Shopping section ─────────────────────────── */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-foreground">Shopping</legend>

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
                <FieldHint id="shoppingItems-hint">Hypothetical newly purchased items.</FieldHint>
              </div>
            </fieldset>
          </div>
        </CardContent>
      </Card>

      {/* ── Right Column: Results ──────────────────────────── */}
      <div className="space-y-6">
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
            <CardTitle>Ecosystem Projection</CardTitle>
            <CardDescription>How this scenario transforms your virtual world.</CardDescription>
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
