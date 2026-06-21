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
Day 1–2   │ Phase 1 – Authentication Foundation (Supabase SSR)
Day 3–4   │ Phase 2 – Carbon Entry + Ecosystem Engine
Day 5     │ Phase 3 – Reflections & Ecosystem Intelligence
Day 6     │ Phase 4 – Impact Simulator
Day 7     │ Phase 5.1 – Onboarding Experience
Day 8     │ Phase 5.2 – Dashboard Hierarchy Redesign
Day 8     │ Phase 5.3 – Guided Carbon Logging Dialog
Day 9     │ Phase 5.3.1 – Gemini Narrative Audit & UX Fixes
Day 9     │ Phase 5.4 – Activity History & Progress Timeline
Day 10    │ Phase 5.5 – Achievements & Milestones
Day 10    │ Phase 5.6 – UX Polish Sweep
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

## 4. Phase-by-Phase Evolution

This section details the objective, major implementation decisions, notable pivots, and final outcome for each phase of development.

### Phase 1 — Authentication Foundation
**Objective:** Establish secure, SSR-based user authentication and route protection using Supabase.
**Major implementation decisions:** Use `@supabase/ssr` with Next.js 15 App Router. Implement middleware (`proxy.ts`) for optimistic redirects and verified `getUser()` for page-level guards.
**Notable pivots:** Transitioned from the deprecated `auth-helpers` to the newer SSR package, ensuring cookie-based session management across Server Components.
**Final outcome:** A robust, zero-regression auth layer with protected routes and progressive enhancement.

### Phase 2 — Carbon Entry + Ecosystem Engine
**Objective:** Implement daily activity logging and deterministic carbon footprint calculation, mapping it to a visual ecosystem.
**Major implementation decisions:** 
- `services/carbon-calculator.ts`: pure functions for deterministic kg CO₂e calculations based on fixed emission factors.
- `services/ecosystem-engine.ts`: translates carbon scores to 0-100 ecosystem health metrics.
- `ecosystem_states`: append-only time-series table design to preserve history.
**Notable pivots:** Schema drift between DB and TypeScript interfaces was identified. Enforced `schema.sql` as the single source of truth (ADR-002).
**Final outcome:** Functional activity logging creating dynamic SVG ecosystem visualisations based on real data.

### Phase 3 — Reflections & Ecosystem Intelligence
**Objective:** Generate human-readable narrative insights derived from the user's ecosystem state.
**Major implementation decisions:** Built a pure-TypeScript deterministic narrative engine (`ecosystem-reflection.ts`) with 20 cross-dimensional sentence templates. No AI API calls required at this tier.
**Notable pivots:** Split narrative intelligence into two tiers: deterministic reflections for immediate UI updates, and Gemini AI for the What-If Simulator, ensuring cost control and reliability.
**Final outcome:** A resilient reflection panel providing immediate, context-aware feedback on the dashboard.

### Phase 4 — Impact Simulator
**Objective:** Allow users to safely experiment with hypothetical lifestyle changes and preview their effects.
**Major implementation decisions:** 
- Reused the pure `carbon-calculator.ts` for hypothetical scenarios.
- Integrated Gemini Flash 2.0 to generate personalized three-part narratives (Observation, Implication, Suggested Action).
**Notable pivots:** Decided to make Gemini narratives ephemeral and implemented a robust deterministic fallback to ensure the app functions even without an API key.
**Final outcome:** A highly engaging `/simulator` route with side-by-side ecosystem comparison and AI-driven contextual insights.

### Phase 5.1 — Onboarding Experience
**Objective:** Welcome new users and guide them to their first activity log.
**Major implementation decisions:** Implemented an `OnboardingCard` component dynamically rendered only when the user has zero daily entries.
**Notable pivots:** Opted for inline onboarding on the dashboard rather than a multi-step blocking modal to reduce friction.
**Final outcome:** A smooth, welcoming first-time user experience that immediately encourages engagement.

### Phase 5.2 — Dashboard Hierarchy Redesign
**Objective:** Improve the information architecture of the main dashboard to handle new progression features.
**Major implementation decisions:** Reorganized components into distinct sections: Hero/Onboarding, Progress Section, Ecosystem Visualization, and Recent Activity.
**Notable pivots:** Moved away from a single column of cards to a more structured, grid-based layout that prioritizes the ecosystem canvas.
**Final outcome:** A scalable dashboard layout capable of housing the growing feature set cleanly.

### Phase 5.3 — Guided Carbon Logging Dialog
**Objective:** Lower the cognitive load of entering daily carbon data.
**Major implementation decisions:** Refactored the monolithic carbon entry form into a multi-step `GuidedEntryDialog` with a conversational UI flow.
**Notable pivots:** Replaced raw number inputs with interactive slider components and visual feedback per step.
**Final outcome:** Increased usability and engagement during the core daily action of the platform.

### Phase 5.3.1 — Gemini Narrative Audit & UX Fixes
**Objective:** Refine AI narrative generation to be more concise and responsive.
**Major implementation decisions:** Adjusted the Gemini prompt to enforce stricter length constraints (300 tokens, 3-4 sentences). Added loading skeletons to the narrative panel.
**Notable pivots:** Addressed an injection vulnerability by explicitly sanitizing user inputs before interpolation.
**Final outcome:** Faster, more relevant AI narratives with a polished loading experience.

### Phase 5.4 — Activity History & Progress Timeline
**Objective:** Provide users with a transparent view of their historical data and ecosystem trends.
**Major implementation decisions:** Developed a `RecentActivity` component fetching ordered historical `daily_entries`. Utilized the append-only `ecosystem_states` table.
**Notable pivots:** Decided to show a condensed timeline on the dashboard rather than a separate page, keeping the user grounded in their current state.
**Final outcome:** A clear, chronological history log that reinforces the connection between past actions and current ecosystem health.

### Phase 5.5 — Achievements & Milestones
**Objective:** Introduce gamification to encourage long-term retention and sustainable habit building.
**Major implementation decisions:** Created a badge system for streaks, total entries, and ecosystem health milestones. Implemented `AchievementsSection` and `AchievementCard` components.
**Notable pivots:** Shifted from complex backend achievement tracking to deriving milestones dynamically from the existing `daily_entries` and `streak-calculator.ts` at render time.
**Final outcome:** A rewarding progression system that celebrates user milestones without database bloat.

### Phase 5.6 — UX Polish Sweep
**Objective:** Finalize the visual and interactive quality of the application before submission.
**Major implementation decisions:** Applied consistent `shadcn/ui` design tokens, refined Tailwind spacing and typography, ensured WCAG AA colour contrast across all tiers, and added micro-animations.
**Notable pivots:** Consolidated disparate UI components into standardized `Card` and `Alert` structures.
**Final outcome:** A professional, production-ready aesthetic that wows the user at first glance.

---

## 6. Summary

CarbonCanvas demonstrates that **prompt engineering is software engineering**. The most productive prompts were not the broadest ones — "build my app" — but the most precisely constrained ones: they specified roles, named exact library versions, listed explicit prohibitions, defined output formats, and provided domain knowledge that the AI could not have inferred from general training data alone.

The evolution from V1 (broad, underspecified) to V2+ (structured, reference-anchored, adversarial) reflects the same maturity cycle that any engineering team goes through when adopting a new tool: start with intuition, fail fast, codify lessons into repeatable patterns.

The result is a full-stack hackathon MVP with a clear separation of concerns, a test-covered business logic layer, a secured database schema with RLS, cached AI-generated narratives, and an SVG ecosystem that responds to real user behavior — built in 10 days by a human engineer and an AI pair programmer working in disciplined collaboration.

---

*Generated for PromptWars Challenge 3 — CarbonCanvas by Kumar Nayan Jain*