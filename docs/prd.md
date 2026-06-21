# CarbonCanvas — Product Requirements Document (PRD)

## Overview

CarbonCanvas is a Carbon Footprint Awareness Platform designed to help individuals understand, track, and reduce their environmental impact through visual storytelling, personalised insights, and behavioural nudges.

Unlike traditional carbon calculators that only display numbers and charts, CarbonCanvas transforms carbon footprint data into a living digital ecosystem that visibly flourishes or degrades based on the user's daily choices.

The goal is to create **awareness** rather than simply provide tracking metrics.

---

## Problem Statement

Many individuals are unaware of the environmental impact of their daily activities.

Existing carbon tracking solutions often present data in a numerical format that fails to create emotional engagement or lasting behavioural change.

Users need a simple and engaging way to understand how their choices affect the environment and what actions they can take to improve.

---

## Vision

To transform carbon footprint tracking into an interactive awareness experience that encourages sustainable decision-making through visualisation, personalisation, and actionable insights.

---

## Target Users

### Primary Users

* Students
* Young professionals
* Environmentally conscious individuals

### Secondary Users

* Communities
* Educational institutions
* Sustainability-focused groups

---

## Goals

### User Goals

* Understand personal carbon footprint
* Discover high-impact habits
* Receive practical reduction suggestions
* Observe progress over time
* Experiment with hypothetical lifestyle changes safely

### Product Goals

* Increase carbon awareness through emotional engagement
* Encourage sustainable behaviour via visual feedback
* Make environmental impact understandable and personal
* Provide actionable, AI-powered recommendations

---

## Core Features

### 1. Daily Activity Logging ✅ Implemented

Users log activities related to:

* **Transport**: Mode (car, bus, train, bicycle, walking) + distance in km
* **Food**: Dietary category (vegetarian, mixed, meat)
* **Energy usage**: Daily household consumption in kWh
* **Shopping**: Number of items purchased

One consolidated entry is stored per user per day (`UNIQUE(user_id, date)` constraint). Re-submitting updates the existing entry.

---

### 2. Carbon Footprint Calculation ✅ Implemented

The system estimates a daily carbon footprint score in **kg CO₂e** using predefined, deterministic emission factors (`src/services/carbon-calculator.ts`).

Output:
* Daily carbon score displayed on the dashboard
* Score used as input to the ecosystem engine and impact simulator

---

### 3. Living Ecosystem Visualisation ✅ Implemented

The application visualises environmental impact through a dynamic SVG-based ecosystem (`src/components/ecosystem/ecosystem-canvas.tsx`).

Environmental dimensions (each scored 0–100):

* **Forest Health** — reflects low-carbon transport and lifestyle choices
* **Water Quality** — affected by energy usage and transport emissions
* **Air Quality** — sensitive to driving, heating, and energy sources
* **Biodiversity** — influenced by dietary choices and overall footprint

Ecosystem health is derived from the daily carbon score via a tiered lookup table (`src/services/ecosystem-engine.ts`). Positive habits push metrics toward 100; high-emission days push them toward 0.

Health tier labels:
* **At Risk** (0–24)
* **Recovering** (25–49)
* **Healthy** (50–79)
* **Flourishing** (80–100)

---

### 4. Ecosystem Status Badges ✅ Implemented

At-a-glance health tier badges for each ecosystem dimension (`src/components/ecosystem/ecosystem-status-badges.tsx`), styled with WCAG AA-compliant colour tokens from `src/services/health-tier.ts`.

---

### 5. Deterministic AI Reflections ✅ Implemented

A cross-dimensional reflection engine (`src/services/ecosystem-reflection.ts`) generates contextual, human-readable narrative sentences for the current ecosystem state — without requiring an AI API key.

Generates:
* One reflection sentence per dimension (forest, water, air, biodiversity)
* One holistic summary sentence
* An overall tone (`critical`, `cautious`, `positive`, `thriving`) for UI styling

Displayed via `src/components/ecosystem/ecosystem-reflection-panel.tsx`.

---

### 6. Impact Simulator ✅ Implemented

Users experiment with hypothetical lifestyle changes via a dedicated `/simulator` route.

Examples:
* What if I cycle instead of driving?
* What if I reduce meat consumption?
* What if I use less energy at home?

The simulator (`src/services/impact-simulator.ts`):
1. Takes the user's most recent `DailyEntry` as the baseline.
2. Accepts partial `SimulationChanges` (any subset of the five activity fields).
3. Computes current and projected carbon scores using the shared calculator.
4. Derives ecosystem deltas for all four dimensions.
5. Returns a full `SimulationResult` including `reductionPercentage`.

Multiple scenarios can be evaluated in a single call via `simulateMultiple()`.

---

### 7. Ecosystem Comparison Visualisation ✅ Implemented

The Impact Simulator displays a side-by-side comparison of the current ecosystem state vs. the projected future state using two `EcosystemCanvas` instances (`src/components/ecosystem/ecosystem-comparison.tsx`).

---

### 8. AI What-If Narratives ✅ Implemented

After running a simulation, users can request a Gemini Flash 2.0-powered three-part narrative (`src/services/simulator-narrative.ts`):

* **Observation** — what the simulation numbers show
* **Implication** — the real-world environmental meaning
* **Suggested Action** — one concrete, actionable next step

The narrative is **ephemeral** (never persisted to the database). If `GEMINI_API_KEY` is absent or the API call fails, a deterministic template-based narrative is returned automatically. Users can see whether a narrative was AI-generated via the `isAiGenerated` flag.

---

### 9. Sustainability Streaks ✅ Implemented

The dashboard displays the user's current and longest consecutive logging streaks (`src/services/streak-calculator.ts`), with motivational messages tied to streak milestones.

Rules:
* A streak counts consecutive calendar days on which an entry was logged.
* The streak remains active if the last entry was today *or* yesterday.
* Duplicate dates are deduplicated; order is normalised internally.

---

### 10. Progress Dashboard ✅ Implemented

The `/dashboard` route displays:

* Today's carbon score (kg CO₂e)
* Overall ecosystem health (composite average of four dimensions)
* Individual metric cards for Forest Health, Water Quality, Air Quality, Biodiversity — each with a progress bar
* Streak card (current streak + longest streak)
* Link to the Impact Simulator

---

## Success Metrics

### Engagement

* Daily active users
* Weekly activity submissions
* Simulator usage rate

### Awareness

* Reduction in carbon footprint over time
* Adoption of recommended actions from simulator

### Experience

* Time spent exploring ecosystem visualisation
* Completion rate of activity logging

---

## Non-Functional Requirements

### Performance

* Page load under 2 seconds
* Server-side rendering for all data-fetching pages
* Parallel data fetching on the dashboard via `Promise.all()`

### Accessibility

* WCAG AA-compliant interface
* Keyboard navigation support (skip-to-content link implemented)
* Screen reader compatibility via ARIA landmarks, `aria-live`, `aria-label`
* Progress bars expose `role="progressbar"` with `aria-valuenow/min/max`
* Colour contrast ≥ 4.5:1 for all tier badges

### Security

* Authenticated user access enforced at middleware + page level
* Row Level Security (RLS) on all Supabase tables
* Environment variables never committed; `.env.local` in `.gitignore`
* No service role key exposure in client-side code

### Scalability

* Append-only `ecosystem_states` table supports unlimited historical data
* `insights` table schema supports future AI-generated persistent recommendations

---

## Out of Scope (MVP)

* Carbon credit marketplace
* Real-world offset purchases
* Social networking platform
* Enterprise sustainability reporting
* Real-time IoT integrations
* Persistent AI insights (the `insights` table is seeded but not yet written to by the application)
* Historical trend charts (data exists in `ecosystem_states`; UI not yet built)
* Weekly automated Gemini reflection jobs
