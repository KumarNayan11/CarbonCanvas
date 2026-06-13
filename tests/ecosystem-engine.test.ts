import { describe, it, expect } from 'vitest'
import {
  calculateEcosystemState,
  calculateOverallHealth,
} from '../src/services/ecosystem-engine'
import type { EcosystemState } from '../src/services/ecosystem-engine'

// ============================================================
// Helpers
// ============================================================

/** Assert that every field of an EcosystemState equals the expected value. */
function expectUniformHealth(state: EcosystemState, value: number) {
  expect(state.forestHealth).toBe(value)
  expect(state.waterQuality).toBe(value)
  expect(state.airQuality).toBe(value)
  expect(state.biodiversity).toBe(value)
}

/** Assert that every field is an integer in [0, 100]. */
function expectValidState(state: EcosystemState) {
  const fields: (keyof EcosystemState)[] = [
    'forestHealth',
    'waterQuality',
    'airQuality',
    'biodiversity',
  ]
  for (const field of fields) {
    const value = state[field]
    expect(Number.isInteger(value), `${field} must be an integer`).toBe(true)
    expect(value, `${field} must be ≥ 0`).toBeGreaterThanOrEqual(0)
    expect(value, `${field} must be ≤ 100`).toBeLessThanOrEqual(100)
  }
}

// ============================================================
// calculateEcosystemState — carbon brackets
// ============================================================

describe('calculateEcosystemState() — carbon brackets', () => {
  // ----- Tier 1: ≤ 5 → 95 -----

  it('score of 0 → health 95', () => {
    expectUniformHealth(calculateEcosystemState(0), 95)
  })

  it('score of 2.5 (mid-bracket) → health 95', () => {
    expectUniformHealth(calculateEcosystemState(2.5), 95)
  })

  it('score of 5 (exact boundary, inclusive) → health 95', () => {
    expectUniformHealth(calculateEcosystemState(5), 95)
  })

  // ----- Tier 2: > 5 and ≤ 10 → 85 -----

  it('score of 5.001 (just above lower boundary) → health 85', () => {
    expectUniformHealth(calculateEcosystemState(5.001), 85)
  })

  it('score of 7.5 (mid-bracket) → health 85', () => {
    expectUniformHealth(calculateEcosystemState(7.5), 85)
  })

  it('score of 10 (exact boundary, inclusive) → health 85', () => {
    expectUniformHealth(calculateEcosystemState(10), 85)
  })

  // ----- Tier 3: > 10 and ≤ 20 → 65 -----

  it('score of 10.001 (just above lower boundary) → health 65', () => {
    expectUniformHealth(calculateEcosystemState(10.001), 65)
  })

  it('score of 15 (mid-bracket) → health 65', () => {
    expectUniformHealth(calculateEcosystemState(15), 65)
  })

  it('score of 20 (exact boundary, inclusive) → health 65', () => {
    expectUniformHealth(calculateEcosystemState(20), 65)
  })

  // ----- Tier 4: > 20 and ≤ 30 → 45 -----

  it('score of 20.001 (just above lower boundary) → health 45', () => {
    expectUniformHealth(calculateEcosystemState(20.001), 45)
  })

  it('score of 25 (mid-bracket) → health 45', () => {
    expectUniformHealth(calculateEcosystemState(25), 45)
  })

  it('score of 30 (exact boundary, inclusive) → health 45', () => {
    expectUniformHealth(calculateEcosystemState(30), 45)
  })

  // ----- Tier 5: > 30 → 25 -----

  it('score of 30.001 (just above lower boundary) → health 25', () => {
    expectUniformHealth(calculateEcosystemState(30.001), 25)
  })

  it('score of 50 (high emission) → health 25', () => {
    expectUniformHealth(calculateEcosystemState(50), 25)
  })

  it('score of 1000 (extreme) → health 25', () => {
    expectUniformHealth(calculateEcosystemState(1000), 25)
  })
})

// ============================================================
// calculateEcosystemState — return type validation
// ============================================================

describe('calculateEcosystemState() — return type validation', () => {
  const representatives = [0, 3, 5, 8, 10, 15, 20, 25, 30, 50]

  for (const score of representatives) {
    it(`score ${score}: all fields are integers in [0, 100]`, () => {
      expectValidState(calculateEcosystemState(score))
    })
  }

  it('returns an object with exactly the four expected keys', () => {
    const state = calculateEcosystemState(10)
    const keys = Object.keys(state).sort()
    expect(keys).toEqual(
      ['airQuality', 'biodiversity', 'forestHealth', 'waterQuality'],
    )
  })
})

// ============================================================
// calculateOverallHealth
// ============================================================

describe('calculateOverallHealth()', () => {
  it('returns 95 when all four dimensions are 95 (tier-1 state)', () => {
    const state = calculateEcosystemState(5)
    expect(calculateOverallHealth(state)).toBe(95)
  })

  it('returns 85 when all four dimensions are 85 (tier-2 state)', () => {
    const state = calculateEcosystemState(10)
    expect(calculateOverallHealth(state)).toBe(85)
  })

  it('returns 65 when all four dimensions are 65 (tier-3 state)', () => {
    expect(calculateOverallHealth(calculateEcosystemState(20))).toBe(65)
  })

  it('returns 45 when all four dimensions are 45 (tier-4 state)', () => {
    expect(calculateOverallHealth(calculateEcosystemState(30))).toBe(45)
  })

  it('returns 25 when all four dimensions are 25 (tier-5 state)', () => {
    expect(calculateOverallHealth(calculateEcosystemState(50))).toBe(25)
  })

  it('correctly averages a mixed state and rounds to nearest integer', () => {
    const state: EcosystemState = {
      forestHealth: 80,
      waterQuality: 60,
      airQuality: 70,
      biodiversity: 90,
    }
    // (80 + 60 + 70 + 90) / 4 = 300 / 4 = 75
    expect(calculateOverallHealth(state)).toBe(75)
  })

  it('rounds 0.5 up to 1 (standard rounding)', () => {
    // (1 + 0 + 0 + 0) / 4 = 0.25 → rounds to 0
    // Need a case where sum/4 ends in .5 — e.g. totals of 2 → 0.5 → 1
    const state: EcosystemState = {
      forestHealth: 2,
      waterQuality: 0,
      airQuality: 0,
      biodiversity: 0,
    }
    // 2 / 4 = 0.5 → Math.round(0.5) = 1
    expect(calculateOverallHealth(state)).toBe(1)
  })

  it('returns an integer', () => {
    const state: EcosystemState = {
      forestHealth: 80,
      waterQuality: 61,
      airQuality: 73,
      biodiversity: 88,
    }
    const result = calculateOverallHealth(state)
    expect(Number.isInteger(result)).toBe(true)
  })

  it('returns 0 for an all-zero state', () => {
    const state: EcosystemState = {
      forestHealth: 0,
      waterQuality: 0,
      airQuality: 0,
      biodiversity: 0,
    }
    expect(calculateOverallHealth(state)).toBe(0)
  })

  it('returns 100 for an all-100 state', () => {
    const state: EcosystemState = {
      forestHealth: 100,
      waterQuality: 100,
      airQuality: 100,
      biodiversity: 100,
    }
    expect(calculateOverallHealth(state)).toBe(100)
  })
})
