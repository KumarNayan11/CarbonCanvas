# CarbonCanvas: Architecture

This document describes the final architecture of the CarbonCanvas MVP as **actually implemented**. It serves as the ground-truth reference for contributors, combining the initial design decisions with the Architectural Decision Records (ADRs) that were confirmed or amended during development.

---

## 1. Core Principles

- **Next.js App Router** with **Server Actions** (no `/api/` routes).
- **Supabase** for Auth and PostgreSQL, managed via a single `supabase/schema.sql`.
- **Gemini Flash 2.0** for AI narrative generation — with a deterministic fallback so the app never breaks when the API key is absent.
- **SVG-based ecosystem visualizer** — lightweight canvas rendered entirely in React/SVG, no 3D dependencies.
- **Dedicated `services/` layer** — all business logic is pure functions decoupled from React and the database.
- **Tailwind CSS v4** — CSS-first configuration via `src/app/globals.css`; no `tailwind.config.ts` file.

---

## 2. Final Folder Structure

```text
CarbonCanvas/
├── docs/                               # Architecture Decision Records & specs
├── tests/                              # Vitest unit tests
│   ├── carbon-calculator.test.ts
│   └── ecosystem-engine.test.ts
├── supabase/
│   └── schema.sql                      # Unified reference DB schema + RLS
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── actions/                    # Server Actions (split by domain)
│   │   │   ├── auth.ts                 # Sign-up / sign-in / sign-out
│   │   │   ├── carbon.ts               # Daily carbon entry + ecosystem snapshot
│   │   │   └── simulator.ts            # AI what-if narrative generation
│   │   ├── dashboard/                  # Protected dashboard route
│   │   │   └── page.tsx
│   │   ├── login/                      # Auth routes
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   ├── simulator/                  # Impact Simulator route
│   │   │   └── page.tsx
│   │   ├── layout.tsx                  # Global App Layout
│   │   ├── page.tsx                    # Public Landing Page
│   │   └── globals.css                 # Tailwind v4 directives + design tokens
│   │
│   ├── components/                     # Domain-driven React Components
│   │   ├── ui/                         # shadcn/ui primitives (button, card, progress…)
│   │   ├── auth/                       # Authentication forms
│   │   │   ├── auth-card.tsx
│   │   │   ├── login-form.tsx
│   │   │   └── signup-form.tsx
│   │   ├── carbon/                     # Carbon tracking & simulator UI
│   │   │   ├── carbon-entry-form.tsx   # Legacy flat form (optional fallback)
│   │   │   ├── guided-entry-dialog.tsx # New multi-step guided logging
│   │   │   ├── simulator-client.tsx    # Client-side Impact Simulator shell
│   │   │   ├── simulator-narrative-panel.tsx  # AI narrative display
│   │   │   └── streak-card.tsx         # Current & longest streak display
│   │   ├── dashboard/                  # Layout and widgets for main dashboard
│   │   │   ├── achievement-card.tsx
│   │   │   ├── achievements-section.tsx
│   │   │   ├── ecosystem-journey.tsx
│   │   │   ├── onboarding-card.tsx
│   │   │   ├── progress-section.tsx
│   │   │   ├── recent-activity.tsx
│   │   │   └── trend-summary.tsx
│   │   ├── ecosystem/                  # SVG visualizers & reflection panels
│   │   │   ├── ecosystem-canvas.tsx    # Primary SVG ecosystem visualization
│   │   │   ├── ecosystem-comparison.tsx # Side-by-side current vs. projected view
│   │   │   ├── ecosystem-reflection-panel.tsx # Deterministic narrative display
│   │   │   └── ecosystem-status-badges.tsx   # Health tier badge grid
│   │   └── accessibility/              # A11y helpers
│   │       └── skip-to-content.tsx
│   │
│   ├── lib/                            # Third-Party Integrations
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser Supabase client
│   │   │   ├── server.ts               # Server-side Supabase client
│   │   │   ├── middleware.ts           # Session refresh middleware helper
│   │   │   └── env.ts                  # Environment variable validation
│   │   └── utils.ts                    # Class merging utility (clsx + tailwind-merge)
│   │
│   ├── services/                       # Core Domain Logic (pure functions only)
│   │   ├── carbon-calculator.ts        # Emission factor math (kg CO₂e per activity)
│   │   ├── ecosystem-engine.ts         # Carbon score → ecosystem health metrics
│   │   ├── ecosystem-reflection.ts     # Deterministic narrative generation for ecosystem
│   │   ├── health-tier.ts              # 0–100 value → tier label + WCAG-compliant styles
│   │   ├── impact-simulator.ts         # What-if scenario engine (multi-scenario support)
│   │   ├── simulator-narrative.ts      # Gemini Flash AI narrative generation + fallback
│   │   └── streak-calculator.ts        # Consecutive logging streak calculator
│   │
│   ├── types/
│   │   └── index.ts                    # Shared TypeScript interfaces (Profile, DailyEntry…)
│   │
│   └── proxy.ts                        # Next.js middleware proxy entry point
│
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

---

## 3. Module Responsibilities

| Module / Path | Execution Tier | Core Responsibility |
| :--- | :--- | :--- |
| **`src/app/`** | Server & Client | Handles layout, routing, and **Server Actions**. Routes coordinate user requests and invoke the services layer. |
| **`src/app/actions/auth.ts`** | Server | Sign-up, sign-in, and sign-out via Supabase Auth. |
| **`src/app/actions/carbon.ts`** | Server | Validates, calculates, and persists daily carbon entries + ecosystem snapshots. |
| **`src/app/actions/simulator.ts`** | Server | Generates AI what-if narratives; never writes to the database. |
| **`src/components/*`** | Client | Strictly domain-driven visual layers: `auth`, `carbon`, `ecosystem`, `accessibility`, `ui`. |
| **`src/services/`** | Server | Mathematical and narrative core. All pure functions — no React, no Supabase, no side effects. |
| **`src/lib/supabase/`** | Server & Client | Initializes Supabase clients for browser, server, and middleware contexts. |
| **`tests/`** | Build/CI | Fast Vitest unit tests for all pure service functions. |

### Service Layer Breakdown

| Service | Responsibility |
|---|---|
| `carbon-calculator.ts` | Translates raw activity inputs into standardised kg CO₂e emission scores using fixed emission factors. |
| `ecosystem-engine.ts` | Converts a daily carbon score into a set of four ecosystem health values (0–100) via a tiered lookup table. |
| `ecosystem-reflection.ts` | Generates deterministic, cross-dimensional narrative sentences from four health metrics — no AI, no randomness. |
| `health-tier.ts` | Maps a 0–100 health value to a `HealthTierLabel` (`At Risk`, `Recovering`, `Healthy`, `Flourishing`) and WCAG-AA-compliant Tailwind style tokens. |
| `impact-simulator.ts` | Accepts a user's `DailyEntry` and a set of hypothetical `SimulationChanges`, computes current vs. projected scores, and returns a full `SimulationResult` including ecosystem deltas. |
| `simulator-narrative.ts` | Calls Gemini Flash 2.0 to generate a three-part (Observation, Implication, Suggested Action) narrative for a `SimulationResult`. Falls back to deterministic templates on failure. |
| `streak-calculator.ts` | Computes current and longest consecutive logging streaks from an array of `YYYY-MM-DD` date strings. |

---

## 4. Routes

| Route | Protection | Description |
|---|---|---|
| `/` | Public | Marketing landing page |
| `/login` | Public (redirects to `/dashboard` if authenticated) | Supabase email/password sign-in |
| `/signup` | Public (redirects to `/dashboard` if authenticated) | New account registration |
| `/dashboard` | Protected (redirects to `/login` if unauthenticated) | Main user dashboard |
| `/simulator` | Protected (redirects to `/login` if unauthenticated) | Impact Simulator |

Route protection is enforced at two layers:
1. **Middleware** (`src/proxy.ts` → `src/lib/supabase/middleware.ts`): Redirects on every request before the page renders.
2. **Page-level auth guard**: Each protected page calls `supabase.auth.getUser()` and redirects if the session is invalid.

---

## 5. Architectural Decision Records (ADRs)

### ADR-001 — `ecosystem_states` is an Append-Only Historical Snapshot Table

**Status:** Accepted  
**Date:** 2026-06-13  
**Confirmed by:** Schema constraint inspection (`pg_constraint`)

---

#### Context

During Phase 2 implementation, a question arose about whether `public.ecosystem_states`
should store a single mutable "current state" row per user (updated via `UPSERT`) or
whether it should accumulate a time-series of snapshots (appended via `INSERT`).

A live schema inspection confirmed the constraints on the table:

```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'ecosystem_states'::regclass;
```

Results:
- `ecosystem_states_pkey` — PRIMARY KEY on `id` ✅
- `ecosystem_states_user_id_fkey` — FOREIGN KEY `user_id → profiles(id)` ✅
- **No `UNIQUE(user_id)` constraint or unique index exists.**

#### Decision

`ecosystem_states` is an **append-only historical snapshot table**.

Each time a user submits a daily carbon entry, a **new row is inserted** recording the
ecosystem health metrics produced by that day's carbon score. Previous snapshots are
**never overwritten or deleted**.

#### Rationale

The append-only design intentionally preserves the full timeline of ecosystem health,
enabling:

- **Trend analysis** — track improvement or deterioration over days/weeks/months
- **Historical charts** — visualise how choices have affected the ecosystem over time
- **Weekly/monthly summaries** — aggregate ecosystem health across time windows
- **AI-generated reflections** — give Gemini the user's history, not just today's score
- **Behaviour change tracking** — correlate lifestyle changes with ecosystem recovery
- **Future analytics** — the raw data is already there when new features need it

Discarding historical snapshots would permanently destroy this data and make these
product features impossible to implement retroactively.

#### Consequences

**Retrieving the current ecosystem state** requires ordering by `created_at` descending
and taking the first row — not a simple lookup by `user_id`:

```typescript
const { data: currentEcosystem } = await supabase
  .from('ecosystem_states')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(1)
  .single()
```

`created_at` is the authoritative ordering field. The existing index
`idx_ecosystem_states_user_created ON ecosystem_states(user_id, created_at DESC)`
makes this query efficient.

#### ⚠️ Contributor Warning — Do NOT Change This

> **Do not convert `ecosystem_states` persistence to `UPSERT`.**  
> Do not add a `UNIQUE(user_id)` constraint to the table.  
> Do not delete or overwrite existing ecosystem snapshots.
>
> Doing so would **silently destroy the historical record** for every existing user
> and make trend analysis, AI reflections, and behaviour-change tracking impossible.
> The use of `INSERT` in `src/app/actions/carbon.ts` is **intentional by design**,
> not an oversight.

---

### ADR-002 — Database Schema as Source of Truth

**Status:** Accepted  
**Date:** 2026-06-14  
**Triggered by:** Runtime persistence failure in Carbon Entry flow

---

#### Context

During Phase 2 manual testing, submitting a daily carbon entry produced the following
Supabase error:

```
Could not find the 'energy_usage' column of 'daily_entries' in the schema cache
```

Investigation revealed **schema drift** between three layers:

| Layer | `daily_entries` columns used |
|---|---|
| **Live PostgreSQL / `schema.sql`** | `transport_distance_km`, `energy_usage_kwh`, `shopping_items` |
| **`docs/database_schema.md`** | ~~`energy_usage`~~, ~~`shopping_score`~~ — outdated names |
| **`src/app/actions/carbon.ts`** | ~~`energy_usage`~~, ~~`shopping_score`~~ — mirrored from stale docs |
| **`src/types/index.ts`** | ~~`energy_usage`~~, ~~`shopping_score`~~ — mirrored from stale docs |

The live database schema had been updated with more descriptive column names
(`energy_usage_kwh`, `shopping_items`, `transport_distance_km`), but the documentation
was never updated, and subsequently generated application code inherited the outdated
names.

#### Decision

1. **The live PostgreSQL schema (`supabase/schema.sql`) is the single authoritative
   source of truth** for all column names, types, and constraints.

2. **Documentation (`docs/database_schema.md`) must mirror the schema exactly.**
   Column names, types, nullability, defaults, and constraints in the documentation
   must match `schema.sql` at all times.

3. **Application code must map explicitly to database column names.**
   TypeScript interfaces in `src/types/index.ts` must use the exact snake_case column
   names from the schema. Server Actions and queries must reference these names
   directly — never inferred or assumed from documentation alone.

4. **Future recommendation:** Generate Supabase database types automatically
   (e.g., via `supabase gen types typescript`) and import them into the application.
   This eliminates manual type definitions and makes schema drift a compile-time
   error rather than a runtime failure.

#### Corrective Actions Taken

| File | Change |
|---|---|
| `src/app/actions/carbon.ts` | `energy_usage` → `energy_usage_kwh`, `shopping_score` → `shopping_items`, added `transport_distance_km` |
| `src/types/index.ts` | `DailyEntry`: same renames + added `transport_distance_km`; `Insight`: added `generated_for_date`, `metadata` |
| `docs/database_schema.md` | Prose columns and embedded SQL snippet fully aligned with `schema.sql` |

#### Consequences

- All future schema changes must be propagated to documentation and types in the
  same commit/PR.
- Contributors should run `npx tsc --noEmit` after any schema-related change to
  verify type alignment.
- If generated types are adopted, the manual `DailyEntry`, `EcosystemState`, and
  `Insight` interfaces in `src/types/index.ts` should be replaced with the generated
  versions.

---

### ADR-003 — Gemini Used Directly in Services, Not via a Shared `lib/gemini.ts`

**Status:** Accepted  
**Date:** 2026-06-15  

#### Decision

The `GoogleGenerativeAI` client is instantiated directly inside `src/services/simulator-narrative.ts` rather than in a shared `src/lib/gemini.ts` module.

#### Rationale

- Only one service currently requires Gemini access.
- Centralising SDK initialisation adds unnecessary indirection for a single consumer.
- The service's fallback logic (template narratives when no key is present) is tightly coupled to the client instantiation — keeping them co-located avoids split logic.
- If a second Gemini consumer is added, a shared `src/lib/gemini.ts` should be extracted at that point.

#### Consequences

- There is no `src/lib/gemini.ts` file. References to it in early architecture drafts are superseded by this ADR.
- The `GEMINI_API_KEY` env var is read directly by `simulator-narrative.ts` via `process.env.GEMINI_API_KEY`.
