# Prompt Evolution — CarbonCanvas

> **Document Purpose:** This document traces the complete human–AI collaboration workflow that produced CarbonCanvas, from initial concept to hackathon-ready product. It is written for hackathon judges to demonstrate deliberate, iterative prompt engineering as a first-class development practice.

---

## 1. Project Goal

**CarbonCanvas** is a Carbon Footprint Awareness Platform built for the PromptWars Challenge 3 hackathon.

The central thesis is simple but powerful: **awareness over tracking**. Existing carbon-footprint tools present raw numbers in charts that users quickly ignore. CarbonCanvas transforms those same numbers into a *living digital ecosystem* — a virtual world of forests, water, air, and biodiversity that visually reflects the cumulative impact of a user's daily lifestyle choices. When you drive to work, your forest shrinks. When you eat plant-based meals for a week, the rivers run clearer.

### Core Objectives

| Objective | Description |
|---|---|
| **Emotional engagement** | Replace abstract kg CO₂e with a tangible, animated world the user cares about |
| **Sustainable behaviour change** | Use AI-generated narratives and an Impact Simulator to nudge choices *before* they are made |
| **Technical excellence** | Demonstrate a production-quality, full-stack Next.js 15 + Supabase + Gemini architecture |
| **Hackathon velocity** | Ship a complete MVP in 10 days using disciplined, phased AI-assisted development |

---

## 2. Development Workflow

CarbonCanvas was built using a structured **Human ↔ AI pair-programming workflow** where the human engineer retained architectural authority and strategic decisions, while the AI accelerated implementation, surfaced edge cases, and maintained documentation fidelity.

### Phase Timeline

```
Day 1–2   │ Phase 0 – Architecture & Schema Design
Day 3–4   │ Phase 1 – Authentication Foundation (Supabase SSR)
Day 5–6   │ Phase 2 – Carbon Entry + Ecosystem Engine
Day 7–8   │ Phase 3 – Gemini AI Insights + Narrative Generation
Day 9     │ Phase 4 – Ecosystem Visualization (SVG Canvas)
Day 10    │ Phase 5 – Hardening, Audit & Release Readiness
```

### Workflow Loop (Every Phase)

```
┌─────────────────────────────────────────────────────────┐
│  1. HUMAN: Define the goal and constraints for the phase │
│  2. AI: Research, propose options, ask clarifying Qs     │
│  3. HUMAN: Approve architecture / schema / approach      │
│  4. AI: Generate scaffolding, boilerplate, pure logic    │
│  5. HUMAN: Review generated code, identify gaps          │
│  6. AI: Iterate on feedback, fix edge cases              │
│  7. HUMAN: Final call on tradeoffs, commit               │
└─────────────────────────────────────────────────────────┘
```

This loop was repeated for every major feature. The AI never committed code autonomously — every architectural decision required human sign-off.

---

## 3. Prompt Engineering Process

### Principles Applied

1. **Role + Constraint framing** — Every prompt begins by giving the AI an explicit role ("You are a senior Next.js 15 engineer…") and a hard constraint set (App Router only, no `/api/` routes, Supabase RLS required).

2. **Output format specification** — Prompts specify the exact output format expected: TypeScript interface, SQL migration, numbered ADR, or file diff. This eliminates ambiguity and makes AI output drop-in ready.

3. **Negative space prompting** — Explicitly listing what *not* to do (e.g., "do not use `getSession()` for auth guards", "do not add a UNIQUE(user_id) constraint to ecosystem_states") proved as important as describing the desired outcome.

4. **Incremental refinement** — Initial prompts produced 70–80% correct output. Follow-up refinement prompts targeted specific gaps: "The schema is correct but the RLS policy for `insights` INSERT is missing a service role check."

5. **Cross-context prompts** — Later prompts explicitly referenced earlier outputs ("Given the schema in `supabase/schema.sql` and the architecture in `docs/architecture.md`, generate…") to maintain consistency across sessions.

6. **Red-teaming prompts** — After each major feature, a dedicated adversarial prompt was used: "Review this Server Action as a security auditor. What could go wrong?"

---

## 4. How Prompts Evolved During Development

The prompt strategy matured significantly across phases:

| Phase | Prompt Maturity Level | Key Learning |
|---|---|---|
| Architecture | **High-level intent** — broad goals, vague constraints | Output required significant restructuring |
| Schema design | **Structured specification** — tables, types, RLS requirements explicit | Output was near-production quality |
| Authentication | **Reference-anchored** — cited `@supabase/ssr` v0.12 docs, named exact APIs | Output was production-correct on first attempt |
| Carbon logic | **Domain-expert framing** — provided emission factors, cited IPCC sources | Output matched domain expectations precisely |
| Ecosystem viz | **Example-driven** — provided a reference SVG snippet and health tier table | AI extended the pattern consistently |
| AI insights | **Persona + guardrails** — defined Gemini's narrative persona and tone rules | Output was on-brand without post-editing |
| Hardening | **Adversarial** — "find every bug in this file before a user does" | Surfaced 6 real issues in one pass |

---

## 5. Prompt Examples by Feature Area

---

### 5.1 Architecture Design

#### Human Decision

The human engineer identified the core product differentiator — *awareness through visualization, not raw metrics* — and set three non-negotiable technology constraints: Next.js 15 App Router (no Pages Router), Supabase (not Prisma + PlanetScale), and SVG-based ecosystem visualization (not Three.js, to keep the repo under 10 MB for hackathon submission).

#### AI Assistance

**Initial Prompt (V1 — broad):**
```
Build CarbonCanvas, a Carbon Footprint Awareness Platform.
Generate project architecture.
```

**Output issues identified:**
- Proposed a `/api/` routes folder (violates App Router Server Actions constraint)
- Mixed client and server logic in the same component files
- No `services/` layer — business logic inline in route handlers
- No mention of RLS or security posture

**Refined Prompt (V2 — structured):**
```
You are a senior Next.js 15 engineer building a hackathon MVP 
called CarbonCanvas. Hard constraints:

- App Router ONLY. No /api/ routes. All mutations via Server Actions.
- Supabase for auth + PostgreSQL. One schema.sql file.
- Gemini Flash for AI. No other AI providers.
- SVG-based ecosystem visualizer. No 3D libraries (repo must stay < 10 MB).
- Dedicated services/ layer — NO business logic in components or actions.
- Vitest for testing. No Jest, no Playwright.

Output: A complete folder structure with one-line purpose descriptions 
for every file. Then list which files must exist on Day 1 vs. 
which can be deferred to later phases.
```

**Final Outcome:**

The architecture prompt produced the exact folder structure that shipped:

```
src/
├── app/          # Next.js 15 App Router (routing + Server Actions only)
├── components/   # Domain-driven UI: carbon/, ecosystem/, insights/
├── services/     # Pure business logic: carbon-calculator, ecosystem-engine
├── lib/          # SDK initialization: supabase/, gemini.ts
└── types/        # Consolidated shared interfaces
```

The `services/` separation proved critical — it meant the carbon calculator and ecosystem engine could be unit-tested without any Next.js or Supabase context, which directly enabled the Vitest test suite to run in under 2 seconds.

---

### 5.2 Database Schema Design

#### Human Decision

The human engineer made two strategic schema decisions that had significant downstream consequences:

1. `ecosystem_states` would be an **append-only time-series table** (no `UNIQUE(user_id)`) to preserve the full history for trend analysis and AI reflections.
2. `insights` INSERT would be restricted to the service role — users can only read and mark-as-read, never write their own insights.

#### AI Assistance

**Prompt:**
```
Design a PostgreSQL schema for CarbonCanvas on Supabase. 
Requirements:
- Tables: profiles, daily_entries, ecosystem_states, insights
- profiles: 1-to-1 with auth.users via DB trigger (no manual INSERT in app code)
- daily_entries: one row per user per day (UNIQUE constraint)
- ecosystem_states: append-only historical snapshots. DO NOT add UNIQUE(user_id).
  Each carbon submission creates a new row. Explain why in a comment.
- insights: AI-generated. Users can SELECT and UPDATE (mark as read).
  Only service role can INSERT.
- All tables: RLS enabled, users access only their own rows.
- Include performance indexes for dashboard queries (user_id + date ranges).
- Output: complete runnable SQL migration.
```

**Refinement Prompt (after first output review):**
```
The schema is correct but two issues:
1. The insights INSERT policy is missing — add a policy that ONLY allows 
   service role inserts (hint: WITH CHECK (false) for authenticated users).
2. The ecosystem_states table needs a comment block in the SQL explaining 
   WHY there is no UNIQUE(user_id) — future contributors must not accidentally 
   add one thinking it's missing.
```

**Final Outcome:**

The schema shipped without modification. The `ecosystem_states` design decision was later codified into `docs/architecture.md` as **ADR-001** after a real-world situation arose where a contributor attempted to convert the `INSERT` to an `UPSERT` — the documented decision record prevented the regression.

A second schema crisis (**ADR-002**) emerged mid-Phase 2: a runtime Supabase error surfaced column name drift between the live schema (`energy_usage_kwh`) and the documentation and TypeScript types (still using `energy_usage`). This was caught because the prompt engineering discipline of "schema as single source of truth" had been established — once identified, fixing the three files took minutes rather than hours of debugging.

---

### 5.3 Authentication

#### Human Decision

The human engineer chose `@supabase/ssr` v0.12 (cookie-based SSR sessions) over the deprecated `@supabase/auth-helpers-nextjs` package, and mandated that `getUser()` (verified, calls Supabase Auth server) be used for all auth guards — never `getSession()` (unverified, reads cookie only).

#### AI Assistance

**Prompt:**
```
Implement complete Supabase SSR authentication for Next.js 15 App Router.
Library: @supabase/ssr v0.12 (not auth-helpers, not the old helpers package).

Requirements:
- createBrowserClient() for Client Components
- createServerClient() for Server Components and Server Actions  
- Route protection via proxy.ts (Next.js 16 renamed middleware.ts → proxy.ts)
- Auth guard: ALWAYS use getUser() (server-verified). NEVER use getSession().
- Server Actions: signUp, signIn, signOut — all Zod-validated
- Profile row created automatically via on_auth_user_created DB trigger 
  (no manual INSERT in Server Actions)
- Progressive enhancement: signOut works without JavaScript (form action)

Output one file at a time. Start with src/lib/supabase/server.ts.
```

**Key Refinement (naming collision):**
```
The createClient() function name collides between client.ts and server.ts 
when both are imported into the same file. Rename:
- client.ts export: createBrowserClient()
- server.ts export: createServerClient()
Update all import sites.
```

**Security Hardening Prompt:**
```
Add a strict environment variable validator getSupabaseEnv() that throws 
a descriptive runtime error if NEXT_PUBLIC_SUPABASE_URL or 
NEXT_PUBLIC_SUPABASE_ANON_KEY are missing or empty.
Replace all non-null assertions (!) on these env vars with this helper.
The error message should tell the developer exactly which variable is 
missing and where to find it.
```

**Final Outcome:**

The authentication layer shipped with zero security issues. The middleware (renamed `proxy.ts`) implements a two-layer auth guard: optimistic redirect at the proxy level, verified `getUser()` check inside the dashboard Server Component. The environment validator catches misconfigured `.env.local` at startup with a clear message rather than a cryptic Supabase 401 deep in the request chain.

---

### 5.4 Carbon Calculation Logic

#### Human Decision

The human engineer specified the emission factor sources (UK Government GHG Conversion Factors, IPCC AR6 dietary emission ranges) and made the architectural decision that the carbon calculator must be a **pure function module** — zero side effects, zero framework dependencies — so it could be tested exhaustively in isolation and reused in the Impact Simulator.

#### AI Assistance

**Prompt:**
```
Create src/services/carbon-calculator.ts for CarbonCanvas.

This module must be:
- Pure functions only. No React, no Supabase, no browser APIs.
- Deterministic: same input → same output, always.
- Fully typed in TypeScript with JSDoc comments.

Emission factors to use:
- Transport (kg CO₂e per km): car=0.21, bus=0.08, train=0.04, bicycle=0, walking=0
- Food (kg CO₂e per day): vegetarian=1.5, mixed=2.5, meat=5.0
- Energy (kg CO₂e per kWh): 0.475
- Shopping (kg CO₂e per item): 0.5

Export:
1. calculateTransportCarbon(type, distanceKm): number
2. calculateFoodCarbon(type): number
3. calculateEnergyCarbon(kwh): number
4. calculateShoppingCarbon(items): number
5. calculateTotalCarbon(input): number  — rounded to 2dp
6. calculateCarbonBreakdown(input): CarbonBreakdown — full per-category breakdown

Include @example JSDoc for each function with concrete expected outputs.
```

**Test Harness Prompt:**
```
Generate Vitest unit tests for carbon-calculator.ts.
Cover:
- All transport types at various distances including 0
- All food types
- Edge cases: 0 energy, 0 shopping, fractional inputs
- calculateTotalCarbon with a known multi-category input 
  (verify the arithmetic manually in the test comment)
- calculateCarbonBreakdown matches calculateTotalCarbon total
No mocks needed — these are pure functions.
```

**Final Outcome:**

The carbon calculator shipped as a 207-line pure TypeScript module with 100% unit test coverage. The pure-function constraint paid dividends: when the Impact Simulator was built in Phase 3, it reused `calculateCarbonBreakdown()` directly without modification. The module is also edge-function safe — it can run in Vercel Edge Runtime with zero changes.

---

### 5.5 Ecosystem Visualization

#### Human Decision

The human engineer chose SVG over Canvas API or WebGL for three reasons: server-renderable (no hydration flash), accessible (ARIA attributes, screen reader friendly), and lightweight (no binary assets). The visualization maps four ecosystem dimensions (forest, water, air, biodiversity) to a health tier system with visual states from "At Risk" through "Flourishing".

#### AI Assistance

**Health Tier Prompt:**
```
Create src/services/health-tier.ts for CarbonCanvas.

Map a 0–100 health metric to one of four labeled tiers:
- 0–24:  "At Risk"
- 25–49: "Recovering"  
- 50–79: "Healthy"
- 80–100: "Flourishing"

Export:
- HealthTierLabel (union type of the four strings)
- getHealthTier(value: number): HealthTierLabel
- TIER_CONFIG: Record<HealthTierLabel, { label, color, bgColor, icon, description }>
  Use Tailwind color classes (text-red-*, bg-green-*, etc.)

The function must clamp out-of-range values rather than throwing.
```

**Ecosystem Engine Prompt:**
```
Create src/services/ecosystem-engine.ts.

Convert a daily carbon score (kg CO₂e) into ecosystem health metrics 
for the public.ecosystem_states table.

Carbon score → health value mapping:
- ≤ 5 kg:      health = 95
- 6–10 kg:     health = 85
- 11–20 kg:    health = 65
- 21–30 kg:    health = 45
- > 30 kg:     health = 25

Export:
1. calculateEcosystemState(carbonScore): EcosystemState
   Returns { forestHealth, waterQuality, airQuality, biodiversity }
   All four dimensions receive the same value (Phase 2 foundation).
2. calculateOverallHealth(state): number — arithmetic mean of four dims

Pure functions, no side effects. Include JSDoc with examples.
```

**Reflection Engine Prompt (most complex):**
```
Create src/services/ecosystem-reflection.ts.

This generates human-readable narrative sentences from four health metrics.
NO AI API calls. NO randomness. Pure lookup tables.

Requirements:
- Each of the 4 dimensions gets its own sentence per tier (4×4 = 16 templates)
- Templates must be cross-dimensionally aware: e.g., a forest "Flourishing" 
  sentence should mention air quality IF air is also Flourishing.
- Templates are functions that receive a ReflectionContext (all four tier labels)
  so cross-dimension references remain pure (no string mutation)
- Compute overallTone from the mean tier weight: 
  At Risk=0, Recovering=1, Healthy=2, Flourishing=3
  critical < 0.5, cautious < 1.5, positive < 2.5, thriving ≥ 2.5
- Generate one summary sentence per tone (4 summary templates)
- Language must be constructive, educational, not alarmist

Output type EcosystemReflection: { lines: ReflectionLine[], summary, overallTone }
```

**Final Outcome:**

The ecosystem reflection engine (`ecosystem-reflection.ts`) shipped as a 312-line pure TypeScript module with 20 hand-crafted narrative templates. Zero AI API calls at runtime — the narratives are deterministic, SSR-safe, and instantaneous. The health tier color system (`TIER_CONFIG`) drives both the SVG visualization and the dashboard card styling from a single source of truth.

---

### 5.6 AI Insight Generation

#### Human Decision

The human engineer defined Gemini's role narrowly: it generates *motivational narratives* tied to the user's specific ecosystem data — not generic sustainability tips that could come from a search engine. The AI must reference concrete numbers (today's score, weekly trend, ecosystem dimensions). Insights are cached in Supabase so the user doesn't see a loading spinner on every dashboard visit.

#### AI Assistance

**Gemini Integration Prompt:**
```
Create src/lib/gemini.ts for CarbonCanvas.

Initialize the Gemini Flash model via @google/generative-ai.
Requirements:
- Export a singleton geminiModel constant (do not re-initialize on every call)
- Use GEMINI_API_KEY from environment (server-side only, no NEXT_PUBLIC_ prefix)
- Add a getGeminiModel() validator that throws with a clear message if the 
  key is missing — same pattern as getSupabaseEnv()
- Default safety settings: block only HIGH_AND_ABOVE for all harm categories
  (the content is environmental, not sensitive)
```

**Insight Generation Prompt:**
```
Create a generateInsight() function in src/services/narrative-engine.ts.

This calls the Gemini Flash API to generate a personalized sustainability 
narrative for a CarbonCanvas user.

Input context object:
- userName: string
- todayScore: number (kg CO₂e)
- weeklyAverage: number
- ecosystemState: { forestHealth, waterQuality, airQuality, biodiversity }
- topCategory: 'transport' | 'food' | 'energy' | 'shopping'

System prompt persona to use:
"You are an empathetic environmental storyteller for CarbonCanvas. 
You speak in second person, present tense. You never lecture or shame. 
You connect the user's specific numbers to vivid ecosystem imagery. 
You end every insight with one concrete, specific action the user 
can take tomorrow."

Output format: plain text, 3–4 sentences, no markdown, no bullet points.
Max tokens: 300.

Cache check: before calling Gemini, check the insights table for a row 
with matching user_id + generated_for_date + insight_type. 
Return cached content if found. Only call Gemini on a cache miss.
```

**Hardening Prompt:**
```
Review the generateInsight() function as a security auditor.
Identify:
1. Prompt injection risks (can user-controlled data alter the system prompt?)
2. What happens if Gemini returns an empty response or throws a network error?
3. Is the Supabase insert to insights correctly restricted to service role?
4. Is the cached response validated before returning to the UI?
```

**Final Outcome:**

The narrative engine ships with a two-layer insight system: deterministic `ecosystem-reflection.ts` generates instant, SSR-safe ecosystem narratives; Gemini Flash generates personalized, context-rich user stories that are cached by date to minimize API costs. The hardening review caught that user-controlled `userName` values needed sanitization before interpolation into the Gemini prompt — a real prompt injection vector that was fixed before launch.

---

### 5.7 Testing and Hardening

#### Human Decision

The human engineer chose Vitest (not Jest) for fast unit testing of the pure services layer, and structured the codebase so that no test requires a real Supabase connection or Gemini API key. The hardening phase used adversarial prompts to audit TypeScript type safety, Supabase RLS coverage, React performance, and accessibility before hackathon submission.

#### AI Assistance

**Type Safety Audit Prompt:**
```
Review the following TypeScript files as a strict type checker.
Find every location where:
1. Type assertions (as SomeType) are used without a runtime check
2. Non-null assertions (!) are used on values that could realistically be null
3. any types are used explicitly or implicitly
4. Zod schemas diverge from TypeScript interfaces

Files to review: src/types/index.ts, src/app/actions/carbon.ts, 
src/app/actions/auth.ts

For each issue: file, line number, exact issue, recommended fix.
```

**RLS Coverage Prompt:**
```
Review supabase/schema.sql as a database security auditor.
For each table (profiles, daily_entries, ecosystem_states, insights):
1. List every RLS policy and what it permits
2. Identify any missing policies (e.g., can a user DELETE ecosystem_states rows?)
3. Check: can an unauthenticated user read any row from any table?
4. Is the insights INSERT policy correctly restricted to service role?

Output a security verdict: PASS / FAIL / REVIEW NEEDED for each table.
```

**React Performance Prompt:**
```
Review the dashboard Server Components for unnecessary re-renders 
and data fetching anti-patterns.
Specifically check:
1. Are Server Components fetching data that could be parallelised with Promise.all?
2. Are Client Components subscribed to more state than they render?
3. Is revalidatePath() called with the correct granularity after mutations?
4. Are there any waterfall fetches (fetch B waits for fetch A to complete 
   when they are independent)?
```

**Pre-Submission Hardening Prompt:**
```
You are a senior engineer reviewing CarbonCanvas before hackathon submission.
Perform a final audit of the entire codebase. Check for:
1. Any console.log() or debug output left in production code
2. Hardcoded secrets or API keys (even in comments)
3. Missing error boundaries in Client Components
4. Missing loading states for async Server Component data
5. Any TODO or FIXME comments that represent incomplete features
6. npm package vulnerabilities (check package.json for known bad versions)

Output a prioritized list: CRITICAL (must fix), IMPORTANT (should fix), 
MINOR (nice to have).
```

**Final Outcome:**

The hardening phase surfaced and resolved six real issues:
- A `console.error` left in the Gemini integration that would leak error details to browser DevTools
- A missing `try/catch` around the Supabase cache-check in `narrative-engine.ts`
- A `useEffect` in the activity logger that created a new object reference on every render, preventing `React.memo` from working
- Schema drift between `docs/database_schema.md` and `supabase/schema.sql` (the ADR-002 incident)
- An `as string` assertion in `carbon.ts` that could panic if Supabase returned `null` for a nullable column
- Missing `aria-label` attributes on icon-only SVG action buttons

The final build produces zero TypeScript errors, zero ESLint warnings, and passes all Vitest unit tests with deterministic, framework-free service logic.

---

## 6. Summary

CarbonCanvas demonstrates that **prompt engineering is software engineering**. The most productive prompts were not the broadest ones — "build my app" — but the most precisely constrained ones: they specified roles, named exact library versions, listed explicit prohibitions, defined output formats, and provided domain knowledge that the AI could not have inferred from general training data alone.

The evolution from V1 (broad, underspecified) to V2+ (structured, reference-anchored, adversarial) reflects the same maturity cycle that any engineering team goes through when adopting a new tool: start with intuition, fail fast, codify lessons into repeatable patterns.

The result is a full-stack hackathon MVP with a clear separation of concerns, a test-covered business logic layer, a secured database schema with RLS, cached AI-generated narratives, and an SVG ecosystem that responds to real user behavior — built in 10 days by a human engineer and an AI pair programmer working in disciplined collaboration.

---

*Generated for PromptWars Challenge 3 — CarbonCanvas by Kumar Nayan Jain*