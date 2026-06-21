# CarbonCanvas 🌿

> A Carbon Footprint Awareness Platform that transforms carbon tracking into an interactive, living ecosystem experience.

## 1. Project Overview

Built for the **PromptWars Challenge 3**, CarbonCanvas goes beyond numbers by visualising the real-world impact of your daily choices through a dynamic, AI-reflected virtual environment. Instead of just showing a static carbon score, CarbonCanvas brings your footprint to life, allowing you to see your personal ecosystem flourish or degrade based on your cumulative lifestyle decisions.

---

## 2. Problem Statement

Many individuals remain unaware of the direct environmental impact of their daily activities. Existing carbon tracking solutions often present data in a numerical, tabular format that fails to create emotional engagement or drive lasting behavioural change. Sustainability tracking feels like a chore, and the abstract nature of "kg CO₂e" makes it difficult for users to connect their personal actions to global environmental outcomes.

---

## 3. Solution Overview

CarbonCanvas solves this disconnect by turning carbon data into a living digital ecosystem. By mapping your daily footprint to four tangible environmental dimensions—Forest Health, Water Quality, Air Quality, and Biodiversity—the platform creates a visceral, personal connection to sustainability. 

Features like the **Impact Simulator** and **AI What-If Narratives** empower users to explore hypothetical scenarios and receive personalized, Gemini-powered insights on how small changes can drastically improve their environment, turning climate awareness into an engaging, gamified journey.

---

## 4. Core Features

- **Daily Activity Logging**: Seamlessly record transport, food, energy usage, and shopping habits via a highly interactive guided dialog.
- **Carbon Footprint Calculation**: Deterministic algorithms calculate precise daily CO₂e emissions based on standard emission factors.
- **Living Ecosystem Visualization**: Watch your personal SVG-based ecosystem flourish or degrade based on your cumulative choices.
- **Ecosystem Status Badges**: At-a-glance health tier badges (At Risk → Recovering → Healthy → Flourishing) for each environmental dimension.
- **Progress Timeline & Activity History**: A visual timeline of your past entries and historical ecosystem states to track long-term trends.
- **Achievements & Milestones**: A comprehensive gamification system that awards badges for logging consistency (streaks), total entries, and reaching high ecosystem health milestones.
- **Sustainability Streaks**: Track your current and longest consecutive logging streaks to build lasting habits.
- **Impact Simulator**: An interactive what-if simulator that lets you experiment with hypothetical lifestyle changes and preview their effect on your carbon score side-by-side.
- **AI What-If Narratives**: Gemini Flash generates a personalised three-part narrative (Observation, Implication, Suggested Action) for each simulation result.
- **Deterministic AI Reflections**: Generates cross-dimensional narrative insights about your ecosystem state. Falls back to deterministic templates when no API key is configured, ensuring the app never breaks.
- **UX Polish & Aesthetics**: Fluid micro-animations, consistent WCAG AA compliant design tokens, and a responsive grid layout using Tailwind v4 and shadcn/ui.

---

## 5. Architecture Summary

CarbonCanvas strictly adheres to modern Next.js App Router best practices:

- **Server-First Approach**: UI components are React Server Components by default to minimise client bundle size.
- **Server Actions**: All form submissions, database mutations, and external API calls (Supabase, Gemini) are securely handled via Server Actions.
- **Pure Domain Logic**: The core calculation services (`carbon-calculator.ts`, `ecosystem-engine.ts`, etc.) are deterministic, unit-tested, and fully decoupled from React or database operations.
- **Append-Only Ecosystem History**: Ecosystem states are stored as append-only records, preserving the full historical timeline for trend analysis and AI reflections.
- **Graceful Degradation**: The AI narrative pipeline incorporates a deterministic fallback template system, meaning the application remains fully functional even without a Gemini API key.

---

## 6. Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router & Server Actions)
- **Language**: TypeScript
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + Row Level Security)
- **AI Intelligence**: [Gemini Flash](https://deepmind.google/technologies/gemini/) via `@google/generative-ai`
- **Styling**: Tailwind CSS (v4, CSS-first configuration)
- **Components**: [shadcn/ui](https://ui.shadcn.com/) + Radix UI
- **Icons**: [Lucide React](https://lucide.dev/)
- **Testing**: [Vitest](https://vitest.dev/)

---

## 7. Setup Instructions

### Prerequisites

Ensure you have the following installed:
- Node.js (v18+)
- npm (or pnpm / yarn)
- A Supabase account ([supabase.com](https://supabase.com))
- A Google AI Studio API key ([aistudio.google.com](https://aistudio.google.com/apikey)) — *optional*

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/KumarNayan11/CarbonCanvas.git
cd CarbonCanvas
npm install
```

### Database Setup

The complete database schema, indexes, RLS policies, and auth triggers are defined in `supabase/schema.sql`.

1. Open your [Supabase SQL Editor](https://supabase.com/dashboard).
2. Copy the contents of `supabase/schema.sql`.
3. Paste and run it to create the required tables and security policies.

### Running Locally

Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

---

## 8. Environment Variables

Create a `.env.local` file in the root directory. See `.env.example` for a reference template.

```env
# Supabase — Required
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# Gemini AI — Optional
# If absent, the Impact Simulator uses deterministic fallback narratives.
GEMINI_API_KEY=<your-gemini-api-key>
```

> **Note:** Never commit your `.env.local` file. It is already listed in `.gitignore`.

---

## 9. Deployment Instructions

CarbonCanvas deploys seamlessly to Vercel.

1. **Push to GitHub** — Vercel auto-deploys on every push to `main`.
2. **Connect the repo** in Vercel Dashboard → New Project → Import from GitHub.
3. **Set Environment Variables**: Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `GEMINI_API_KEY`.
4. **Deploy** — Vercel will run `npm run build` automatically.
5. **Supabase CORS** — Add your Vercel deployment URL to the *Allowed Origins* list in your Supabase Dashboard under **Auth → URL Configuration**.

---

## 10. Screenshots

*Note: Replace the placeholder images below with actual screenshots by placing the files in the `docs/Screenshots/` directory.*

### Dashboard & Logging
| Dashboard Hero | Guided Carbon Logging Dialog |
|:---:|:---:|
| <img src="./docs/Screenshots/dashboard-hero.png" width="400" alt="Dashboard Hero"> | <img src="./docs/Screenshots/guided-logging.png" width="400" alt="Guided Logging Dialog"> |

### Virtual Environment
| Ecosystem Visualization | AI Reflection Panel |
|:---:|:---:|
| <img src="./docs/Screenshots/ecosystem-vis.png" width="400" alt="Ecosystem Visualization"> | <img src="./docs/Screenshots/ai-reflection.png" width="400" alt="AI Reflection Panel"> |

### Simulation
| Impact Simulator | Ecosystem Comparison | AI What-If Narrative |
|:---:|:---:|:---:|
| <img src="./docs/Screenshots/impact-simulator.png" width="260" alt="Impact Simulator"> | <img src="./docs/Screenshots/ecosystem-comparison.png" width="260" alt="Ecosystem Comparison"> | <img src="./docs/Screenshots/ai-what-if.png" width="260" alt="AI What-If Narrative"> |

### Progression
| Progress Timeline | Achievements & Milestones |
|:---:|:---:|
| <img src="./docs/Screenshots/progress-timeline.png" width="400" alt="Progress Timeline"> | <img src="./docs/Screenshots/achievements.png" width="400" alt="Achievements & Milestones"> |

---

## 11. Future Scope

- **Social Accountability**: Introduce friendly leaderboards and the ability to view generalised ecosystem health maps for communities.
- **Automated Insights Job**: A scheduled background job to generate weekly Gemini-powered holistic reflections based on an aggregated 7-day footprint.
- **Historical Trend Charts**: Visualise ecosystem health over time using the existing append-only `ecosystem_states` time-series data with interactive graphs.
- **Enterprise Sustainability Reporting**: Aggregate reporting dashboards for organisations to track collective impact.

---

## License

This project is open-source and available under the [MIT License](LICENSE).

---

Built for PromptWars Challenge 3.