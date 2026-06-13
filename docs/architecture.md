# CarbonCanvas: Final Approved Architecture

This document finalizes the architecture for the CarbonCanvas 10-day MVP hackathon project. It consolidates the initial production proposal and the hackathon simplification revision while incorporating the explicitly approved decisions.

### Core Decisions Retained
- **Next.js 15 App Router** with **Server Actions** (no `/api/` routes).
- **Supabase** for Auth and PostgreSQL, managed via a single `schema.sql`.
- **Gemini Flash** for fast AI inference.
- **SVG-based visualizer** ensuring a lightweight repository (<10MB) over 3D models.
- **Dedicated `services/` layer** retained to decouple AI and business logic from UI components.
- Specific domain-driven component categorization (`ui`, `carbon`, `ecosystem`, `insights`, `accessibility`).

---

## 1. Final Folder Structure

```text
carbon-canvas/
├── docs/                               # Project documentation & specs
├── tests/                              # Global test configs & mocks
│   ├── setup.ts                        # Vitest environment setup
│   └── mocks/                          # Mock Gemini/Supabase responses
├── supabase/
│   └── schema.sql                      # Single unified reference DB schema
├── src/
│   ├── app/                            # Next.js 15 App Router
│   │   ├── actions.ts                  # Server Actions (Gemini & DB mutations)
│   │   ├── login/                      # Authentication routes
│   │   │   ├── page.tsx
│   │   │   └── page.test.tsx
│   │   ├── dashboard/                  # Core Dashboard Route
│   │   │   ├── page.tsx
│   │   │   └── page.test.tsx
│   │   ├── layout.tsx                  # Global App Layout & Context Providers
│   │   ├── page.tsx                    # Landing Page
│   │   └── globals.css                 # Tailwind directives
│   │
│   ├── components/                     # Categorized React Components
│   │   ├── ui/                         # shadcn/ui primitives (button, card, dialog)
│   │   ├── carbon/                     # Carbon tracking UI
│   │   │   ├── activity-logger.tsx
│   │   │   └── score-display.tsx
│   │   ├── ecosystem/                  # SVG-based visualizers
│   │   │   ├── ecosystem-canvas.tsx
│   │   │   ├── forest-svg.tsx
│   │   │   └── water-svg.tsx
│   │   ├── insights/                   # AI Storytelling UI
│   │   │   ├── narrative-card.tsx
│   │   │   └── actionable-tip.tsx
│   │   └── accessibility/              # A11y helpers
│   │       ├── skip-to-content.tsx
│   │       └── high-contrast-toggle.tsx
│   │
│   ├── lib/                            # Third-Party Integrations
│   │   ├── supabase.ts                 # Supabase client instantiation
│   │   └── gemini.ts                   # Gemini SDK initialization
│   │
│   ├── services/                       # Dedicated Business Logic
│   │   ├── carbon-calculator.ts        # Pure calculation logic (framework agnostic)
│   │   ├── narrative-engine.ts         # Generates awareness stories via Gemini
│   │   └── impact-simulator.ts         # What-if scenario mathematical engine
│   │
│   ├── types/
│   │   └── index.ts                    # Consolidated shared interfaces
│   │
│   └── utils/
│       └── cn.ts                       # Class merging utility for Tailwind
│
├── tailwind.config.ts                  # Tailwind configuration
├── tsconfig.json                       # TypeScript config and path mapping
├── vitest.config.ts                    # Vitest fast testing configuration
└── package.json
```

---

## 2. Final Module Responsibilities

| Module / Path | Execution Tier | Core Responsibility |
| :--- | :--- | :--- |
| **`src/app/`** | Server & Client | Handles layout, routing, and **Server Actions**. Routes coordinate user requests and invoke the services layer. |
| **`src/components/*`** | Client | Strictly domain-driven visual layers. Divided into generic `ui`, tracking `carbon`, SVG `ecosystem`, AI `insights`, and `accessibility`. |
| **`src/services/`** | Server | The mathematical and intellectual core. Contains pure functions that are heavily unit-tested without needing a DOM or React context. |
| **`src/lib/`** | Server & Client | Initializes external SDKs. Handles connection pooling, API keys, and offline mock-mode toggles. |
| **`tests/`** | Build/CI | Fast Vitest unit/integration testing ensuring code quality. Bypasses heavy E2E frameworks for speed. |

### Service Layer Breakdown
* **`carbon-calculator.ts`**: Pure math. Translates raw daily activity inputs into standardized emission scores.
* **`narrative-engine.ts`**: The core of "awareness over tracking". Consumes scores and user history, interfaces with Gemini, and outputs compelling, personalized environmental stories.
* **`impact-simulator.ts`**: Processes "what-if" parameters. Feeds theoretical changes into the carbon calculator to predict future ecosystem states.

---

## 3. Files That Should Exist on Day 1

To kickstart development with high velocity, the following foundational files must be established immediately:

* **Configuration & Scaffolding**:
  * `package.json`, `tsconfig.json`, `tailwind.config.ts`, `vitest.config.ts`
  * `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
  * `src/utils/cn.ts`
* **Data & Types**:
  * `supabase/schema.sql` (Define the DB tables right away)
  * `src/types/index.ts` (Define `CarbonLog`, `EcosystemState` interfaces)
* **Clients & Logic Stubbing**:
  * `src/lib/supabase.ts`, `src/lib/gemini.ts`
  * `src/services/carbon-calculator.ts`, `src/services/narrative-engine.ts` (Even if just returning mock data initially)
* **Core UI Primitives**:
  * `src/components/ui/button.tsx`, `src/components/ui/card.tsx`, `src/components/ui/input.tsx`

---

## 4. Files Deferred to Later Phases

To ensure the core MVP is fully polished within 10 days, these files and features will be implemented sequentially in later phases:

* **Phase 2 (Days 5-7): Impact Simulator**
  * `src/app/simulator/page.tsx`
  * `src/services/impact-simulator.ts`
  * Wait until the base carbon tracking and dashboard are solid before allowing users to manipulate hypothetical futures.
* **Phase 3 (Days 8-10): Advanced Visuals & A11y Controls**
  * `src/components/ecosystem/forest-svg.tsx`, `water-svg.tsx` (Start with a unified, simpler `ecosystem-canvas.tsx` on Day 1, componentize the SVGs later if time permits).
  * `src/components/accessibility/high-contrast-toggle.tsx` (Rely on native OS-level high contrast media queries on Day 1; add explicit UI toggles only if extra time remains).

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
