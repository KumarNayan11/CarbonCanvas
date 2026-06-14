/**
 * @file streak-calculator.ts
 * @description Pure service module for calculating sustainability streaks from a
 * user's daily entry dates.
 *
 * A **streak** is a run of consecutive calendar days on which the user logged
 * a carbon entry. The rules are:
 *
 *  - Days are compared in **UTC** to avoid timezone-induced off-by-one errors.
 *  - The **current streak** counts consecutive days ending on *today or yesterday*
 *    (so a user who logs today keeps their streak; one who hasn't logged yet today
 *    still sees their active streak if they logged yesterday).
 *  - The **longest streak** is the maximum consecutive run found anywhere in the
 *    user's complete history.
 *  - A single logged day is a streak of 1.
 *  - No entries → both streaks are 0.
 *  - Duplicate dates (shouldn't happen — UNIQUE constraint) are deduplicated.
 *
 * All functions are deterministic and side-effect-free — safe for Server Actions,
 * edge functions, and unit tests.
 */

// ============================================================
// Types
// ============================================================

/**
 * The result of a streak calculation.
 */
export interface StreakResult {
  /**
   * Number of consecutive days ending on today or yesterday that the user
   * has logged an entry. 0 if no active streak exists.
   */
  currentStreak: number

  /**
   * The longest consecutive run of days ever recorded by the user.
   * Equal to or greater than `currentStreak`. 0 if no entries exist.
   */
  longestStreak: number
}

// ============================================================
// Internal helpers
// ============================================================

/**
 * Parses a "YYYY-MM-DD" date string as a UTC midnight timestamp (ms since epoch).
 * Using UTC avoids any local-timezone shifts that could cause an apparent gap
 * between e.g. "2024-01-31" (UTC-5 local) and "2024-02-01".
 */
function dateStringToUtcMs(dateStr: string): number {
  // Date.UTC with the parsed parts is safe and explicit.
  const [year, month, day] = dateStr.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

/** Number of milliseconds in one calendar day. */
const ONE_DAY_MS = 24 * 60 * 60 * 1000

/**
 * Returns today's UTC date as a "YYYY-MM-DD" string.
 * Extracted into a helper so it can be overridden in tests via `todayOverride`.
 */
function todayUtcMs(): number {
  const now = new Date()
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
}

// ============================================================
// Core algorithm
// ============================================================

/**
 * Processes a list of distinct, sorted (ascending) UTC timestamps (ms) into
 * an array of consecutive run lengths.
 *
 * @param sortedUniqueMs - Ascending array of UTC midnight timestamps.
 * @returns Array of run lengths (e.g. [1, 3, 2] for gaps of 1, 3, 2).
 *
 * @example
 * // Three consecutive days, then a gap, then two more:
 * computeRuns([0, 86400000, 172800000, 432000000, 518400000])
 * // → [3, 2]
 *
 * @internal
 */
export function computeRuns(sortedUniqueMs: number[]): number[] {
  if (sortedUniqueMs.length === 0) return []

  const runs: number[] = []
  let currentRun = 1

  for (let i = 1; i < sortedUniqueMs.length; i++) {
    const diff = sortedUniqueMs[i] - sortedUniqueMs[i - 1]
    if (diff === ONE_DAY_MS) {
      // Consecutive day — extend current run.
      currentRun++
    } else {
      // Gap — save the completed run and start a new one.
      runs.push(currentRun)
      currentRun = 1
    }
  }

  // Push the final run.
  runs.push(currentRun)
  return runs
}

// ============================================================
// Public API
// ============================================================

/**
 * Calculates the current and longest sustainability streaks from an array of
 * entry date strings.
 *
 * @param dates - Array of "YYYY-MM-DD" strings from `daily_entries.date`.
 *   - Order does not matter — the function sorts internally.
 *   - Duplicates are removed — the function deduplicates internally.
 *   - Empty array → `{ currentStreak: 0, longestStreak: 0 }`.
 * @param todayOverride - Optional UTC midnight ms override for the current date.
 *   Useful in tests to pin "today" to a specific value.
 * @returns {@link StreakResult} with `currentStreak` and `longestStreak`.
 *
 * @example
 * // User logged three consecutive days ending yesterday:
 * calculateStreaks(['2024-01-13', '2024-01-14', '2024-01-15'])
 * // (assuming today is 2024-01-16)
 * // → { currentStreak: 3, longestStreak: 3 }
 *
 * @example
 * // No entries:
 * calculateStreaks([])
 * // → { currentStreak: 0, longestStreak: 0 }
 *
 * @example
 * // Gap in history, latest run is active:
 * calculateStreaks(['2024-01-01', '2024-01-02', '2024-01-10', '2024-01-11'])
 * // (assuming today is 2024-01-11)
 * // → { currentStreak: 2, longestStreak: 2 }
 */
export function calculateStreaks(
  dates: string[],
  todayOverride?: number,
): StreakResult {
  // ── Edge case: no entries ──────────────────────────────────────────────────
  if (dates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 }
  }

  // ── 1. Deduplicate and convert to UTC ms ──────────────────────────────────
  const uniqueMs = Array.from(
    new Set(dates.map(dateStringToUtcMs)),
  ).sort((a, b) => a - b) // ascending

  // ── 2. Compute all consecutive runs ───────────────────────────────────────
  const runs = computeRuns(uniqueMs)

  // ── 3. Longest streak = maximum run length ────────────────────────────────
  const longestStreak = Math.max(...runs)

  // ── 4. Current streak ─────────────────────────────────────────────────────
  // The current streak is the length of the *last* run in the sorted list,
  // but only if that run's final day is today or yesterday.
  // If the most recent entry is older than yesterday, the streak is broken.
  const today    = todayOverride ?? todayUtcMs()
  const yesterday = today - ONE_DAY_MS

  const lastEntryMs = uniqueMs[uniqueMs.length - 1]
  const lastRunLength = runs[runs.length - 1]

  const currentStreak =
    lastEntryMs === today || lastEntryMs === yesterday
      ? lastRunLength
      : 0

  return { currentStreak, longestStreak }
}

// ============================================================
// Display helpers
// ============================================================

/**
 * Returns a short motivational message based on the current streak length.
 * Purely presentational — safe to call in any context.
 *
 * @param currentStreak - The user's active streak count.
 * @returns A one-line encouragement string.
 */
export function getStreakMessage(currentStreak: number): string {
  if (currentStreak === 0)  return 'Log your first entry to start a streak!'
  if (currentStreak === 1)  return 'Great start — log again tomorrow to build momentum.'
  if (currentStreak < 7)   return `${currentStreak} days strong — keep it going!`
  if (currentStreak < 30)  return `${currentStreak}-day streak! You're building a real habit.`
  return `Incredible — ${currentStreak} consecutive days of tracking! 🌿`
}
