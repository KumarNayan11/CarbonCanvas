/**
 * @file carbon-calculator.ts
 * @description Pure service module for calculating carbon footprint from daily activities.
 *
 * This module is intentionally free of React, Supabase, and any browser/Node-specific APIs.
 * All functions are deterministic and side-effect-free — safe to import in any context
 * (Server Actions, edge functions, tests, etc.).
 */

// ============================================================
// Types
// ============================================================

/**
 * Supported modes of transport for carbon calculation.
 * Maps directly to the `transport_type` column in `public.daily_entries`.
 */
export type TransportType = 'car' | 'bus' | 'train' | 'bicycle' | 'walking' | 'unknown'

/**
 * Dietary category of the user.
 * Maps directly to the `food_type` column in `public.daily_entries`.
 */
export type FoodType = 'vegetarian' | 'mixed' | 'meat' | 'unknown'

/**
 * All inputs required to compute a full daily carbon footprint.
 * Field names are camelCase mirrors of the snake_case DB columns.
 */
export interface CarbonCalculationInput {
  /** Mode of transport used today. Maps to `transport_type`. */
  transportType: TransportType
  /** Distance travelled in kilometres. Maps to `transport_distance_km`. */
  transportDistanceKm: number
  /** Dietary category for the day. Maps to `food_type`. */
  foodType: FoodType
  /** Electricity/gas consumed in kilowatt-hours. Maps to `energy_usage_kwh`. */
  energyUsageKwh: number
  /** Number of non-essential items purchased. Maps to `shopping_items`. */
  shoppingItems: number
}

/**
 * Breakdown of the carbon calculation alongside the rounded total.
 */
export interface CarbonBreakdown {
  transportKg: number
  foodKg: number
  energyKg: number
  shoppingKg: number
  /** Total carbon footprint in kg CO₂e, rounded to 2 decimal places. */
  totalKg: number
}

// ============================================================
// Emission factors (kg CO₂e per unit)
// ============================================================

/** kg CO₂e emitted per kilometre by transport type. */
const TRANSPORT_FACTORS: Record<TransportType, number> = {
  car: 0.21,
  bus: 0.08,
  train: 0.04,
  bicycle: 0,
  walking: 0,
  unknown: 0.14, // Roughly average of car and public transit
} as const

/** kg CO₂e emitted per day by dietary category. */
const FOOD_FACTORS: Record<FoodType, number> = {
  vegetarian: 1.5,
  mixed: 2.5,
  meat: 5.0,
  unknown: 2.5, // Default to mixed diet as a safe average
} as const

/** kg CO₂e emitted per kWh of energy consumed. */
const ENERGY_FACTOR_PER_KWH = 0.475

/** kg CO₂e emitted per shopping item purchased. */
const SHOPPING_FACTOR_PER_ITEM = 0.5

// ============================================================
// Individual calculation functions
// ============================================================

/**
 * Calculates the carbon footprint contribution from transport.
 *
 * @param transportType - The mode of transport used.
 * @param distanceKm - Distance travelled in kilometres (must be ≥ 0).
 * @returns Carbon emitted in kg CO₂e.
 *
 * @example
 * calculateTransportCarbon('car', 20) // → 4.2
 * calculateTransportCarbon('bicycle', 10) // → 0
 */
export function calculateTransportCarbon(
  transportType: TransportType,
  distanceKm: number,
): number {
  return TRANSPORT_FACTORS[transportType] * distanceKm
}

/**
 * Calculates the carbon footprint contribution from food consumption.
 *
 * @param foodType - The dietary category for the day.
 * @returns Carbon emitted in kg CO₂e.
 *
 * @example
 * calculateFoodCarbon('meat')        // → 5
 * calculateFoodCarbon('vegetarian')  // → 1.5
 */
export function calculateFoodCarbon(foodType: FoodType): number {
  return FOOD_FACTORS[foodType]
}

/**
 * Calculates the carbon footprint contribution from energy consumption.
 *
 * @param energyUsageKwh - Energy consumed in kilowatt-hours (must be ≥ 0).
 * @returns Carbon emitted in kg CO₂e.
 *
 * @example
 * calculateEnergyCarbon(10) // → 4.75
 */
export function calculateEnergyCarbon(energyUsageKwh: number): number {
  return ENERGY_FACTOR_PER_KWH * energyUsageKwh
}

/**
 * Calculates the carbon footprint contribution from shopping activity.
 *
 * @param shoppingItems - Number of non-essential items purchased (must be ≥ 0).
 * @returns Carbon emitted in kg CO₂e.
 *
 * @example
 * calculateShoppingCarbon(4) // → 2
 */
export function calculateShoppingCarbon(shoppingItems: number): number {
  return SHOPPING_FACTOR_PER_ITEM * shoppingItems
}

/**
 * Calculates the total daily carbon footprint from all activity categories.
 *
 * Sums transport, food, energy, and shopping contributions and rounds the
 * result to **2 decimal places** for display and storage purposes.
 *
 * @param input - Full set of daily activity data.
 * @returns Total carbon footprint in kg CO₂e, rounded to 2 decimal places.
 *
 * @example
 * calculateTotalCarbon({
 *   transportType: 'car',
 *   transportDistanceKm: 20,
 *   foodType: 'mixed',
 *   energyUsageKwh: 10,
 *   shoppingItems: 2,
 * })
 * // transport: 4.2 + food: 2.5 + energy: 4.75 + shopping: 1.0 = 12.45
 */
export function calculateTotalCarbon(input: CarbonCalculationInput): number {
  const transport = calculateTransportCarbon(
    input.transportType,
    input.transportDistanceKm,
  )
  const food = calculateFoodCarbon(input.foodType)
  const energy = calculateEnergyCarbon(input.energyUsageKwh)
  const shopping = calculateShoppingCarbon(input.shoppingItems)

  const total = transport + food + energy + shopping
  return Math.round(total * 100) / 100
}

/**
 * Calculates a full carbon breakdown including per-category values and the
 * rounded total. Useful for displaying a detailed summary to the user.
 *
 * @param input - Full set of daily activity data.
 * @returns {@link CarbonBreakdown} with individual category contributions and total.
 *
 * @example
 * calculateCarbonBreakdown({
 *   transportType: 'bus',
 *   transportDistanceKm: 15,
 *   foodType: 'vegetarian',
 *   energyUsageKwh: 5,
 *   shoppingItems: 0,
 * })
 * // { transportKg: 1.2, foodKg: 1.5, energyKg: 2.375, shoppingKg: 0, totalKg: 5.07 }
 */
export function calculateCarbonBreakdown(
  input: CarbonCalculationInput,
): CarbonBreakdown {
  const transportKg = calculateTransportCarbon(
    input.transportType,
    input.transportDistanceKm,
  )
  const foodKg = calculateFoodCarbon(input.foodType)
  const energyKg = calculateEnergyCarbon(input.energyUsageKwh)
  const shoppingKg = calculateShoppingCarbon(input.shoppingItems)

  const totalKg = Math.round((transportKg + foodKg + energyKg + shoppingKg) * 100) / 100

  return { transportKg, foodKg, energyKg, shoppingKg, totalKg }
}
