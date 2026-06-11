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
