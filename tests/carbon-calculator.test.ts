import { describe, it, expect } from 'vitest'
import {
  calculateTransportCarbon,
  calculateFoodCarbon,
  calculateEnergyCarbon,
  calculateShoppingCarbon,
  calculateTotalCarbon,
  calculateCarbonBreakdown,
} from '../src/services/carbon-calculator'
import type { CarbonCalculationInput } from '../src/services/carbon-calculator'

// ============================================================
// Transport
// ============================================================

describe('calculateTransportCarbon()', () => {
  it('applies the correct factor for car (0.21 kg/km)', () => {
    expect(calculateTransportCarbon('car', 100)).toBe(21)
  })

  it('applies the correct factor for bus (0.08 kg/km)', () => {
    expect(calculateTransportCarbon('bus', 50)).toBe(4)
  })

  it('applies the correct factor for train (0.04 kg/km)', () => {
    expect(calculateTransportCarbon('train', 25)).toBe(1)
  })

  it('returns 0 for bicycle regardless of distance', () => {
    expect(calculateTransportCarbon('bicycle', 999)).toBe(0)
  })

  it('returns 0 for walking regardless of distance', () => {
    expect(calculateTransportCarbon('walking', 999)).toBe(0)
  })

  it('returns 0 for any mode when distance is 0', () => {
    expect(calculateTransportCarbon('car', 0)).toBe(0)
  })

  it('handles fractional distances correctly', () => {
    // 0.21 * 1.5 = 0.315
    expect(calculateTransportCarbon('car', 1.5)).toBeCloseTo(0.315)
  })
})

// ============================================================
// Food
// ============================================================

describe('calculateFoodCarbon()', () => {
  it('returns 1.5 for vegetarian', () => {
    expect(calculateFoodCarbon('vegetarian')).toBe(1.5)
  })

  it('returns 2.5 for mixed', () => {
    expect(calculateFoodCarbon('mixed')).toBe(2.5)
  })

  it('returns 5 for meat', () => {
    expect(calculateFoodCarbon('meat')).toBe(5)
  })
})

// ============================================================
// Energy
// ============================================================

describe('calculateEnergyCarbon()', () => {
  it('applies 0.475 kg per kWh correctly', () => {
    expect(calculateEnergyCarbon(10)).toBe(4.75)
  })

  it('returns 0 when energy usage is 0', () => {
    expect(calculateEnergyCarbon(0)).toBe(0)
  })

  it('handles large values correctly', () => {
    // 0.475 * 200 = 95
    expect(calculateEnergyCarbon(200)).toBe(95)
  })
})

// ============================================================
// Shopping
// ============================================================

describe('calculateShoppingCarbon()', () => {
  it('applies 0.5 kg per item correctly', () => {
    expect(calculateShoppingCarbon(4)).toBe(2)
  })

  it('returns 0 when no items are purchased', () => {
    expect(calculateShoppingCarbon(0)).toBe(0)
  })

  it('handles a single item', () => {
    expect(calculateShoppingCarbon(1)).toBe(0.5)
  })
})

// ============================================================
// Total (rounding behaviour)
// ============================================================

describe('calculateTotalCarbon()', () => {
  it('sums all categories and rounds to 2 decimal places', () => {
    const input: CarbonCalculationInput = {
      transportType: 'car',
      transportDistanceKm: 20,  // 0.21 * 20 = 4.2
      foodType: 'mixed',         // 2.5
      energyUsageKwh: 10,        // 0.475 * 10 = 4.75
      shoppingItems: 2,          // 0.5 * 2 = 1.0
    }
    // 4.2 + 2.5 + 4.75 + 1.0 = 12.45
    expect(calculateTotalCarbon(input)).toBe(12.45)
  })

  it('returns 0 for a fully zero-carbon day', () => {
    const input: CarbonCalculationInput = {
      transportType: 'bicycle',
      transportDistanceKm: 100,
      foodType: 'vegetarian',
      energyUsageKwh: 0,
      shoppingItems: 0,
    }
    // 0 + 1.5 + 0 + 0 = 1.5
    expect(calculateTotalCarbon(input)).toBe(1.5)
  })

  it('rounds a result with many decimal places to exactly 2 dp', () => {
    const input: CarbonCalculationInput = {
      transportType: 'train',
      transportDistanceKm: 3,    // 0.04 * 3 = 0.12
      foodType: 'vegetarian',    // 1.5
      energyUsageKwh: 3,         // 0.475 * 3 = 1.425
      shoppingItems: 1,          // 0.5
    }
    // 0.12 + 1.5 + 1.425 + 0.5 = 3.545 → rounds to 3.55
    expect(calculateTotalCarbon(input)).toBe(3.55)
  })

  it('handles a high-emission day correctly', () => {
    const input: CarbonCalculationInput = {
      transportType: 'car',
      transportDistanceKm: 200,  // 42
      foodType: 'meat',           // 5
      energyUsageKwh: 50,         // 23.75
      shoppingItems: 10,          // 5
    }
    // 42 + 5 + 23.75 + 5 = 75.75
    expect(calculateTotalCarbon(input)).toBe(75.75)
  })

  it('result is a number type', () => {
    const input: CarbonCalculationInput = {
      transportType: 'bus',
      transportDistanceKm: 10,
      foodType: 'mixed',
      energyUsageKwh: 5,
      shoppingItems: 3,
    }
    expect(typeof calculateTotalCarbon(input)).toBe('number')
  })
})

// ============================================================
// Breakdown helper
// ============================================================

describe('calculateCarbonBreakdown()', () => {
  it('returns the correct per-category breakdown and rounded total', () => {
    const input: CarbonCalculationInput = {
      transportType: 'bus',
      transportDistanceKm: 15,   // 0.08 * 15 = 1.2
      foodType: 'vegetarian',    // 1.5
      energyUsageKwh: 5,         // 0.475 * 5 = 2.375
      shoppingItems: 0,          // 0
    }
    const result = calculateCarbonBreakdown(input)

    expect(result.transportKg).toBeCloseTo(1.2)
    expect(result.foodKg).toBe(1.5)
    expect(result.energyKg).toBeCloseTo(2.375)
    expect(result.shoppingKg).toBe(0)
    // 1.2 + 1.5 + 2.375 + 0 = 5.075 → rounds to 5.08
    expect(result.totalKg).toBe(5.08)
  })

  it('totalKg in breakdown matches calculateTotalCarbon()', () => {
    const input: CarbonCalculationInput = {
      transportType: 'car',
      transportDistanceKm: 30,
      foodType: 'meat',
      energyUsageKwh: 20,
      shoppingItems: 5,
    }
    expect(calculateCarbonBreakdown(input).totalKg).toBe(calculateTotalCarbon(input))
  })
})
