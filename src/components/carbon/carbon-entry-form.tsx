'use client'

import { useActionState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { submitCarbonEntry } from '@/app/actions/carbon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { CarbonActionState } from '@/app/actions/carbon'

// ============================================================
// Sub-components
// ============================================================

/** Inline field-error paragraph wired to aria-describedby. */
function FieldError({ id, messages }: { id: string; messages: string[] | undefined }) {
  if (!messages?.length) return null
  return (
    <p id={id} className="text-sm text-destructive" role="alert">
      {messages[0]}
    </p>
  )
}

/** Muted helper text beneath a form field. */
function FieldHint({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="text-xs text-muted-foreground">
      {children}
    </p>
  )
}

// ============================================================
// Main form
// ============================================================

/**
 * Carbon entry form — Client Component.
 *
 * Uses React 19's `useActionState` to wire directly to the
 * `submitCarbonEntry` Server Action. All calculation and validation
 * logic remains server-side; this component only handles presentation.
 *
 * Architecture constraints:
 * - Does NOT import carbon-calculator.ts or ecosystem-engine.ts.
 * - Does NOT duplicate Zod validation.
 * - All numeric coercion happens in the Server Action.
 */
export function CarbonEntryForm() {
  const [state, formAction, isPending] = useActionState<CarbonActionState, FormData>(
    submitCarbonEntry,
    undefined,
  )

  // Derive field errors — only present on failure
  const errors = state && !state.success ? state.errors : undefined

  return (
    <Card className="border border-emerald-100 dark:border-emerald-900/50 shadow-xl shadow-emerald-900/5">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-semibold">Log today&apos;s activity</CardTitle>
        <CardDescription className="text-muted-foreground">
          Record your transport, food, energy, and shopping to track your daily carbon footprint.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={formAction}
          className="space-y-6"
          noValidate
          aria-label="Log today's carbon activity"
        >

          {/* ── Success banner ────────────────────────────── */}
          {state?.success && (
            /*
             * role="status" (implied by aria-live="polite") is correct here:
             * the message is informational and does not interrupt the user.
             * WCAG 2.1 SC 4.1.3 — Status Messages (Level AA)
             */
            <Alert
              role="status"
              className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <AlertDescription className="text-emerald-800 dark:text-emerald-300">
                {state.message}
              </AlertDescription>
            </Alert>
          )}

          {/* ── Server-level error ────────────────────────── */}
          {state && !state.success && state.message && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          {/* ── Transport section ────────────────────────── */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-foreground">Transport</legend>

            {/* Transport Type */}
            <div className="space-y-2">
              <Label htmlFor="transportType">Transport type</Label>
              <select
                id="transportType"
                name="transportType"
                required
                defaultValue=""
                aria-describedby={
                  errors?.transportType ? 'transportType-error' : 'transportType-hint'
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>Select a mode of transport…</option>
                <option value="car">🚗 Car</option>
                <option value="bus">🚌 Bus</option>
                <option value="train">🚆 Train</option>
                <option value="bicycle">🚲 Bicycle</option>
                <option value="walking">🚶 Walking</option>
              </select>
              <FieldHint id="transportType-hint">How you primarily travelled today.</FieldHint>
              <FieldError id="transportType-error" messages={errors?.transportType} />
            </div>

            {/* Transport Distance */}
            <div className="space-y-2">
              <Label htmlFor="transportDistanceKm">Distance (km)</Label>
              <Input
                id="transportDistanceKm"
                name="transportDistanceKm"
                type="number"
                min={0}
                step={0.1}
                placeholder="0.0"
                required
                aria-describedby={
                  errors?.transportDistanceKm
                    ? 'transportDistanceKm-error'
                    : 'transportDistanceKm-hint'
                }
                className="transition-all duration-200 focus:ring-2 focus:ring-emerald-500/40"
              />
              <FieldHint id="transportDistanceKm-hint">
                Approximate distance travelled today.
              </FieldHint>
              <FieldError id="transportDistanceKm-error" messages={errors?.transportDistanceKm} />
            </div>
          </fieldset>

          {/* ── Food section ─────────────────────────────── */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-foreground">Food</legend>

            {/* Food Type */}
            <div className="space-y-2">
              <Label htmlFor="foodType">Diet type</Label>
              <select
                id="foodType"
                name="foodType"
                required
                defaultValue=""
                aria-describedby={errors?.foodType ? 'foodType-error' : 'foodType-hint'}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>Select your diet for today…</option>
                <option value="vegetarian">🥗 Vegetarian</option>
                <option value="mixed">🍽️ Mixed</option>
                <option value="meat">🥩 Meat-heavy</option>
              </select>
              <FieldHint id="foodType-hint">The type of food you consumed today.</FieldHint>
              <FieldError id="foodType-error" messages={errors?.foodType} />
            </div>
          </fieldset>

          {/* ── Energy section ───────────────────────────── */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-foreground">Energy</legend>

            {/* Energy Usage */}
            <div className="space-y-2">
              <Label htmlFor="energyUsageKwh">Energy usage (kWh)</Label>
              <Input
                id="energyUsageKwh"
                name="energyUsageKwh"
                type="number"
                min={0}
                step={0.1}
                placeholder="0.0"
                required
                aria-describedby={
                  errors?.energyUsageKwh ? 'energyUsageKwh-error' : 'energyUsageKwh-hint'
                }
                className="transition-all duration-200 focus:ring-2 focus:ring-emerald-500/40"
              />
              <FieldHint id="energyUsageKwh-hint">
                Estimated household electricity usage.
              </FieldHint>
              <FieldError id="energyUsageKwh-error" messages={errors?.energyUsageKwh} />
            </div>
          </fieldset>

          {/* ── Shopping section ─────────────────────────── */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-foreground">Shopping</legend>

            {/* Shopping Items */}
            <div className="space-y-2">
              <Label htmlFor="shoppingItems">Shopping items</Label>
              <Input
                id="shoppingItems"
                name="shoppingItems"
                type="number"
                min={0}
                step={1}
                placeholder="0"
                required
                aria-describedby={
                  errors?.shoppingItems ? 'shoppingItems-error' : 'shoppingItems-hint'
                }
                className="transition-all duration-200 focus:ring-2 focus:ring-emerald-500/40"
              />
              <FieldHint id="shoppingItems-hint">
                Number of newly purchased items today.
              </FieldHint>
              <FieldError id="shoppingItems-error" messages={errors?.shoppingItems} />
            </div>
          </fieldset>

          {/* ── Submit ───────────────────────────────────── */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 disabled:opacity-60"
            aria-busy={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Saving entry…
              </>
            ) : (
              'Save today\'s entry'
            )}
          </Button>

        </form>
      </CardContent>
    </Card>
  )
}
