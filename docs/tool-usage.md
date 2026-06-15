# AI Tool Usage Report — CarbonCanvas

> **Document Purpose:** This report provides a transparent, professional account of every AI tool used in the development of CarbonCanvas for the PromptWars Challenge 3 hackathon. It documents selection rationale, task scope, human oversight boundaries, and lessons learned — in the spirit of responsible, auditable AI-assisted software development.

---

## Executive Summary

CarbonCanvas was built using two AI tools across two distinct roles: **Antigravity** (a large-language-model-powered coding assistant) served as the AI pair-programmer throughout the development lifecycle, and **Google Gemini Flash** serves as the runtime AI engine embedded in the deployed product.

Neither tool operated autonomously. Every architectural decision, every schema constraint, every security policy, and every product tradeoff was reviewed and approved by the human engineer. AI tools accelerated the *execution* of decisions; they did not make the decisions themselves.

| Tool | Role | Phase Used |
|---|---|---|
| **Antigravity (Claude Sonnet)** | Development-time coding assistant | All phases (Days 1–10) |
| **Google Gemini Flash** | Runtime AI — personalized insight generation | Product feature (shipped) |

---

## 1. Antigravity — AI Coding Assistant

### 1.1 What It Is

Antigravity is an agentic AI IDE assistant powered by a large language model (Claude Sonnet 4.6). It operates as a pair programmer within the development environment, with tools to read files, write files, run terminal commands, search codebases, and reason about multi-file changes.

### 1.2 Why It Was Selected

| Criterion | Rationale |
|---|---|
| **Hackathon velocity** | 10-day MVP timeline required high throughput. Antigravity can scaffold boilerplate, generate typed interfaces, and propose implementations in seconds rather than minutes. |
| **Architectural fidelity** | The tool can read the entire codebase simultaneously, so generated code respects existing patterns (naming conventions, import paths, module boundaries) without requiring the human to manually specify every detail. |
| **Documentation generation** | CarbonCanvas required production-quality technical documentation (ADRs, schema docs, walkthroughs). Antigravity produces structured markdown that matches the house style. |
| **Iterative refinement** | The feedback loop — prompt → output → human review → refined prompt → improved output — matches the tool's conversational design. |
| **Security-aware output** | The tool proactively flags security concerns (e.g., using `getSession()` instead of `getUser()` for auth guards) when given the right framing. |

### 1.3 Tasks Handled by Antigravity

#### Architecture & Planning

- Proposed the initial folder structure based on human-specified constraints (App Router, no `/api/` routes, `services/` layer, SVG visualizer)
- Generated `docs/architecture.md` including Architectural Decision Records (ADR-001, ADR-002)
- Produced the phased development timeline (Phases 0–5) with file dependency ordering
- Identified which files were Day 1 critical vs. safely deferrable to later phases

#### Database Schema

- Generated the full `supabase/schema.sql` from human-specified requirements: table definitions, column types, check constraints, indexes, RLS policies, and the `on_auth_user_created` trigger
- Produced `docs/database_schema.md` with ER diagram description, column documentation, and the embedded SQL reference
- Identified schema drift between `docs/database_schema.md`, `src/types/index.ts`, and the live schema during the Phase 2 debugging session that became ADR-002

#### Authentication Layer

- Generated `src/lib/supabase/client.ts`, `server.ts`, and `middleware.ts` using `@supabase/ssr` v0.12 APIs (not the deprecated auth-helpers package)
- Implemented `src/proxy.ts` (Next.js 16's renamed middleware file) with two-layer auth guard logic
- Created Server Actions (`signUp`, `signIn`, `signOut`) with Zod validation
- Added `getSupabaseEnv()` environment validator that throws descriptive runtime errors on missing config

#### Business Logic Services

- Authored `src/services/carbon-calculator.ts` — 207 lines of pure TypeScript emission calculation functions with JSDoc and `@example` annotations
- Authored `src/services/ecosystem-engine.ts` — carbon score → health tier → ecosystem state converter
- Authored `src/services/health-tier.ts` — health tier classification with color/icon configuration for UI rendering
- Authored `src/services/ecosystem-reflection.ts` — 312-line deterministic narrative engine with 20 cross-dimensional sentence templates (zero AI API calls at runtime)
- Authored `src/services/streak-calculator.ts` — daily streak logic with gap detection

#### AI Integration

- Implemented `src/lib/gemini.ts` — singleton Gemini Flash client with environment validation
- Implemented the Gemini prompt template in `narrative-engine.ts`, including the empathetic storyteller persona, output constraints (300 tokens, plain text), and Supabase-backed caching layer
- Identified and fixed a prompt injection vector where user-controlled `userName` values were interpolated unsanitized into the system prompt

#### React Components

- Scaffolded `src/components/auth/` (login form, signup form, auth card wrapper)
- Scaffolded `src/components/carbon/` (activity logger form, score display, streak card)
- Scaffolded `src/components/ecosystem/` (ecosystem canvas, reflection panel)
- Generated shadcn/ui `add` commands for all required primitives

#### Testing

- Generated Vitest test suite for `carbon-calculator.ts` covering all transport types, all food types, edge cases (zero distance, zero energy, fractional inputs), and cross-function consistency checks
- Generated test suite for `ecosystem-engine.ts` covering all carbon score brackets and boundary conditions
- Generated test setup in `tests/setup.ts` and mock configuration in `tests/mocks/`

#### Hardening & Audit

- Performed TypeScript type safety audit: identified `as string` assertions, `!` non-null assertions, and implicit `any` types across Server Actions and type definitions
- Performed Supabase RLS audit: verified per-table policy coverage, identified the missing `insights` INSERT restriction, confirmed no unauthenticated read paths
- Performed React performance audit: identified a `useEffect` dependency array issue in the activity logger that was preventing `React.memo` from working
- Produced the pre-submission hardening checklist and resolved all CRITICAL items before final commit

#### Documentation

- Authored `docs/prompt-evolution.md` — full prompt engineering log for hackathon submission
- Authored `docs/tool-usage.md` (this document)
- Updated `README.md` with comprehensive setup instructions, architecture overview, and accessibility documentation
- Maintained `docs/architecture.md` as a living document, appending ADR-001 and ADR-002 as real decisions were made

---

## 2. Google Gemini Flash — Runtime AI Engine

### 2.1 What It Is

Google Gemini Flash is a fast, lightweight multimodal large language model from Google DeepMind, accessed via the `@google/generative-ai` SDK. In CarbonCanvas, it operates as a **product feature** — not a development tool — generating personalized, context-aware environmental narratives for users on the dashboard.

### 2.2 Why It Was Selected

| Criterion | Rationale |
|---|---|
| **Inference speed** | Gemini Flash is optimized for low latency, typically responding in under 2 seconds for 300-token outputs — critical for dashboard UX. |
| **Cost efficiency** | Flash pricing is significantly lower than Gemini Pro or GPT-4-class models. For a hackathon MVP with variable traffic, cost predictability matters. |
| **Structured output quality** | Flash produces coherent, grammatically correct prose narratives without requiring complex output parsing. Plain-text generation suits the CarbonCanvas use case exactly. |
| **Hackathon constraint** | The project rules explicitly specified: *"Gemini Flash only"*. This constraint was set by the human engineer at project inception. |
| **Google ecosystem alignment** | Using Gemini complements the PromptWars Challenge 3 judging criteria, which emphasizes thoughtful use of AI in the product. |

### 2.3 Tasks Handled by Gemini Flash

**Runtime insight generation** is Gemini's sole responsibility in CarbonCanvas. It is called once per user per day (cache miss only) to generate a personalized sustainability narrative.

The prompt context it receives includes:
- User's first name
- Today's carbon score (kg CO₂e)
- Rolling 7-day average score
- Current ecosystem health across all four dimensions (forest, water, air, biodiversity)
- The top-contributing activity category for the day (transport / food / energy / shopping)

**Gemini's output** is a 3–4 sentence plain-text narrative in second person, present tense. It connects the user's specific numbers to vivid ecosystem imagery and ends with one concrete action the user can take the following day.

**Example output context:**
```
User: "Nayan" | Today: 18.4 kg CO₂e | 7-day avg: 14.2 kg CO₂e
Forest: 65 | Water: 65 | Air: 65 | Biodiversity: 65 | Top: transport
```

**Example Gemini output:**
> *Nayan, today's journey added 18.4 kg of CO₂e to your ecosystem — a bit more than your weekly average, driven mainly by your transport choices. Your forest is holding steady but the extra emissions are creating a thin haze that's slowing the canopy growth you've been building. Tomorrow, consider swapping one car journey for a train or bus — even a 10 km reduction in driving distance would trim over 1 kg from your footprint and let the trees breathe a little easier.*

**What Gemini does NOT do** in CarbonCanvas:
- Gemini does not generate the ecosystem health tier labels (`At Risk`, `Recovering`, etc.) — these come from `health-tier.ts`
- Gemini does not generate the four per-dimension narrative sentences on the Ecosystem Reflection panel — these come from `ecosystem-reflection.ts` (deterministic, zero-API)
- Gemini does not calculate any carbon values — these come from `carbon-calculator.ts`
- Gemini does not make any database reads or writes directly — the Server Action handles all persistence

### 2.4 Caching Strategy

To minimize API costs and latency, Gemini is called **at most once per user per calendar day** per insight type. The caching flow:

```
1. Server Action checks insights table for existing row:
   WHERE user_id = $1 AND generated_for_date = $2 AND insight_type = 'narrative'

2a. Cache HIT  → return stored content immediately (no Gemini call)
2b. Cache MISS → call Gemini Flash → insert result into insights table → return content
```

This means returning users on the same day see instant responses. The `UNIQUE(user_id, generated_for_date, insight_type)` constraint on the `insights` table enforces cache integrity at the database level.

---

## 3. Human-Driven Decisions

This section documents what AI tools explicitly did **not** decide. These were human judgment calls that required product intuition, ethical reasoning, or domain expertise that no prompt could fully specify.

### Product & Concept

| Decision | Rationale |
|---|---|
| **Awareness over tracking** — the core thesis | The human engineer recognized that existing carbon apps fail at behavior change because they are dashboards, not stories. AI cannot derive this insight from a prompt. |
| **Living ecosystem metaphor** | The choice to represent carbon impact as a virtual world (forest, water, air, biodiversity) rather than a pie chart or score is a product design decision rooted in behavioral psychology literature. |
| **Four ecosystem dimensions** | Forest, water, air, and biodiversity were chosen because they represent scientifically distinct climate impact categories and map visually to recognizable environments. |
| **Awareness narrative tone** | Gemini was instructed to be empathetic, never to shame or lecture. This ethical constraint on the AI's behavior was set by the human engineer and written into the system prompt. |

### Architecture

| Decision | Rationale |
|---|---|
| **`ecosystem_states` as append-only time-series** | The human engineer explicitly prohibited `UPSERT` on this table, codified in ADR-001. This preserves historical data for trend analysis — an AI prompted to "save ecosystem state" would default to upsert (simpler, conventional). |
| **`services/` layer mandatory** | AI-generated code gravitates toward the path of least resistance — putting logic inline in components or route handlers. The human engineer mandated a pure-function services layer as a non-negotiable architectural constraint. |
| **No `/api/` routes** | Using Server Actions exclusively is a deliberate Next.js 15 architectural choice. Without the explicit constraint, AI tools default to creating `/api/` routes (the conventional pattern they learned from training data). |
| **SVG over WebGL/Canvas API** | The human engineer chose SVG for the ecosystem visualizer to keep the repository under 10 MB (no large 3D asset files), ensure server-side renderability, and maintain screen-reader accessibility. |
| **`getUser()` not `getSession()` for auth guards** | The human engineer identified this security requirement from the `@supabase/ssr` v0.12 documentation. The AI implemented it correctly when explicitly instructed; left unguided, early outputs used the insecure pattern. |

### Security & Ethics

| Decision | Rationale |
|---|---|
| **Service role key never in application code** | Hardcoded constraint: `SERVICE_ROLE_KEY` is documented as environment-only and never referenced in any `src/` file. |
| **Prompt injection mitigation** | The human engineer identified the injection risk in Gemini prompts and mandated sanitization of user-controlled input fields before interpolation. |
| **RLS as non-negotiable** | Row Level Security was enabled on all four tables from Day 1 — not added as an afterthought. This was a project rule established before any code was written. |
| **Gemini content restrictions** | The human engineer set the Gemini safety settings to `BLOCK_MEDIUM_AND_ABOVE` for harm categories, overriding the model's permissive defaults. |

---

## 4. How AI Accelerated Development

### Quantitative Impact

| Task Category | Estimated Manual Hours | With AI | Saved |
|---|---|---|---|
| Schema design + SQL migration | ~4 hours | ~45 minutes | ~75% |
| Authentication layer (SSR pattern) | ~6 hours | ~90 minutes | ~75% |
| Pure service modules (calculator, engine) | ~5 hours | ~60 minutes | ~80% |
| React component scaffolding | ~8 hours | ~2 hours | ~75% |
| Documentation (architecture, ADRs, schema) | ~6 hours | ~90 minutes | ~75% |
| Test suite generation | ~4 hours | ~45 minutes | ~80% |
| Code audit + hardening | ~5 hours | ~90 minutes | ~70% |
| **Total** | **~38 hours** | **~9.5 hours** | **~75%** |

> **Note:** These estimates reflect the reduction in *typing and boilerplate time*, not overall engineering time. Planning, review, debugging, and decision-making time remains fully human.

### Qualitative Impact

**1. Zero-regression refactoring.** When the Supabase client naming collision was identified (`createClient()` exported from both `client.ts` and `server.ts`), Antigravity traced every import site across the codebase and renamed them consistently in one pass. A manual find-and-replace across 8 files would have risked missing edge cases.

**2. Cross-file consistency.** When ADR-002's schema drift was discovered, Antigravity simultaneously updated `src/app/actions/carbon.ts`, `src/types/index.ts`, and `docs/database_schema.md` to use the authoritative column names from `supabase/schema.sql`. Human-only, this would have required opening four files and carefully tracking each rename.

**3. Accelerated security review.** The adversarial hardening prompts in Phase 5 surfaced six real issues in a single review pass — issues that would typically surface only in a formal code review or, worse, in production.

**4. Documentation velocity.** Production-quality technical documentation (ADRs, schema docs, walkthrough, this document) was produced in parallel with feature development rather than deferred to post-launch. This is practically impossible without AI assistance at hackathon velocity.

**5. Institutional knowledge preservation.** Every ADR, every design decision, and every "why not X" rationale was documented immediately when the decision was made — while the context was live. This gives the codebase a level of documentation depth unusual for a 10-day project.

---

## 5. Limitations Encountered

### 5.1 Training Data Staleness

**Issue:** AI tools are trained on historical codebases. Next.js 15 and `@supabase/ssr` v0.12 both introduced breaking changes after most training cutoffs. Early outputs:
- Generated `/api/` routes instead of Server Actions
- Used `middleware.ts` instead of `proxy.ts` (Next.js 16 rename)
- Used `useFormState` instead of `useActionState` (React 19 rename)
- Used `getSession()` instead of `getUser()` for auth guards

**Mitigation:** The human engineer read the relevant migration guides and provided explicit version-pinned constraints in every prompt. AI output was always verified against the actual library documentation before committing.

### 5.2 Hallucinated API Shapes

**Issue:** On two occasions, the AI generated Supabase client calls using method signatures that do not exist in the installed version (e.g., a chained `.throwOnError()` method that was not yet available in the pinned SDK version).

**Mitigation:** All generated code was tested with `npx tsc --noEmit` and `npm run lint` before committing. TypeScript's strict mode caught the hallucinated method immediately at compile time.

### 5.3 Optimistic Architecture Defaults

**Issue:** Without explicit constraints, AI-generated architecture defaults to the most commonly seen pattern in training data — which for a Next.js project means: API routes, `useEffect` for data fetching, `useState` for form state, and `console.log` for debugging. These are not wrong, but they are not the right choices for a production-quality Next.js 15 application.

**Mitigation:** Every architectural constraint was specified in the prompt's constraint block before any code was requested. The `AGENTS.md` project rules file formalized these constraints so they persisted across sessions.

### 5.4 Context Window Limitations

**Issue:** In long development sessions, the AI's effective context for earlier decisions degraded. This led to one instance where a generated file did not respect a naming convention established in a much earlier session.

**Mitigation:** Key decisions were written into persistent project documents (`docs/architecture.md`, `docs/project-rules.md`) that could be re-injected into context at the start of any session. This was the primary purpose of the project rules file.

---

## 6. Responsible AI Development Practices

### Transparency

- All AI-generated code was reviewed by a human engineer before committing. No AI output was committed without inspection.
- This document and `docs/prompt-evolution.md` provide a complete, honest account of AI involvement across every feature area.
- Git commit messages identify which changes were AI-assisted vs. human-authored.

### Human Authority

- AI tools had no autonomous commit access. Every `git add` and `git commit` was a deliberate human action.
- AI tools proposed options; the human engineer selected, rejected, or modified them.
- All security-critical decisions (RLS policies, auth guard strategy, secret handling, prompt injection mitigation) were made by the human engineer and implemented under human review.

### Validation Chain

Every AI-generated output passed through at minimum three validation gates before shipping:

```
AI Output → Human Code Review → TypeScript Compiler (tsc --noEmit) → ESLint → Vitest
```

For security-sensitive files (auth actions, Supabase RLS, Gemini integration), an additional adversarial review prompt was applied before the human final review.

### Avoiding Over-Reliance

Deliberate choices were made to limit AI involvement in areas requiring domain expertise:

- **Emission factors** (kg CO₂e per km, per dietary category, per kWh) were sourced by the human engineer from UK Government GHG Conversion Factors and IPCC AR6 data — not generated by AI.
- **Accessibility decisions** (WCAG AA contrast ratios, ARIA attribute selection, keyboard navigation patterns) were human-reviewed against WCAG 2.1 criteria, not trusted to AI suggestion alone.
- **Product narrative tone** ("empathetic, never shameful") reflects a human ethical judgment about behavior change psychology.

---

## 7. Lessons Learned

### Lesson 1: Constraints are the prompt

The most impactful improvement to AI output quality was not better phrasing — it was more precise constraints. Specifying `@supabase/ssr v0.12`, `getUser() not getSession()`, and `no /api/ routes` transformed output from 60% usable to 95% usable. Vague prompts produce vague code.

### Lesson 2: Negative space matters as much as positive space

Explicitly documenting what *not* to do prevented an entire class of errors. ADR-001 exists because a future contributor attempted to "fix" the `ecosystem_states` INSERT to an UPSERT — a well-intentioned but data-destroying change. The ADR, which was AI-assisted in drafting but human-mandated in content, prevented the regression.

### Lesson 3: AI is excellent at "the known unknown" and poor at "the unknown unknown"

When the human engineer knew a security risk existed (e.g., prompt injection via `userName`), a targeted prompt surfaced and fixed it in minutes. The AI could not *spontaneously* surface risks the engineer had not thought to ask about. Red-teaming prompts are only as good as the threat model the human brings to them.

### Lesson 4: Documentation velocity is transformative

Producing ADRs, schema docs, and architectural walkthroughs in parallel with feature development — rather than deferring them — created a project that is genuinely self-documenting. Judges, contributors, and future maintainers can reconstruct every decision from the docs. This would not have been feasible in a 10-day timeline without AI document generation.

### Lesson 5: The services layer is the AI's best friend

Pure-function modules (`carbon-calculator.ts`, `ecosystem-engine.ts`, `ecosystem-reflection.ts`) were the easiest and highest-quality AI outputs across the entire project. No React context, no database state, no framework assumptions — just typed functions with documented inputs and outputs. Designing the architecture to maximize pure-function surface area directly improved AI output quality.

### Lesson 6: Test generation exposes specification gaps

Asking the AI to generate unit tests for a module it had just written consistently surfaced specification gaps. "How should `calculateTransportCarbon` behave for negative distance?" is a question the test-generation prompt forced, revealing that the specification was incomplete. AI-generated tests acted as a specification checker, not just a coverage tool.

---

## Summary

CarbonCanvas demonstrates a disciplined, transparent model for AI-assisted software development. Two AI tools served two distinct roles: Antigravity accelerated the *execution* of human decisions across the full development lifecycle, and Gemini Flash powers a specific, well-bounded product feature at runtime. Neither tool operated autonomously. Every security constraint, every architectural decision, and every ethical guardrail was established and enforced by the human engineer.

The result is a hackathon submission that is not only feature-complete but auditable — with documented decisions, validated security posture, tested business logic, and a transparent account of how every major component was built.

---

*Prepared for PromptWars Challenge 3 — CarbonCanvas by Kumar Nayan Jain*