# CarbonCanvas 🌿

> A Carbon Footprint Awareness Platform that transforms carbon tracking into an interactive, living ecosystem experience.

Built for the **PromptWars Challenge 3**, CarbonCanvas goes beyond numbers by visualising the real-world impact of your daily choices through a dynamic, AI-reflected virtual environment.

---

## 🎯 Core Features

- **Daily Activity Logging**: Seamlessly record transport, food, energy usage, and shopping habits.
- **Carbon Footprint Calculation**: Deterministic algorithms calculate precise daily $CO_2e$ emissions.
- **Living Ecosystem Visualization**: Watch your personal ecosystem flourish or degrade based on your cumulative choices.
- **AI-Powered Environmental Insights**: Receive empathetic, context-aware narratives powered by Gemini Flash detailing the state of your forest, water, air, and biodiversity.
- **Impact Simulator**: Preview how hypothetical lifestyle changes alter your future ecosystem.
- **Progress Dashboard**: Track your current and longest streaks alongside a historical snapshot of your footprint.

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router & Server Actions)
- **Language**: TypeScript
- **Database & Auth**: [Supabase](https://supabase.com/)
- **AI Intelligence**: [Gemini Flash](https://deepmind.google/technologies/gemini/)
- **Styling**: Tailwind CSS (v4)
- **Components**: [shadcn/ui](https://ui.shadcn.com/) + Radix UI

## 🚀 Getting Started

### 1. Prerequisites

Ensure you have the following installed:
- Node.js (v18+)
- npm or pnpm
- A Supabase account

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/KumarNayan11/CarbonCanvas.git
cd CarbonCanvas
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory and add the following variables. See `.env.example` for reference.

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Database Setup

The necessary database schema and Row Level Security (RLS) policies are provided in `supabase/schema.sql`.
Execute this script in your Supabase SQL Editor to initialize the required tables (`profiles`, `daily_entries`, `ecosystem_states`, `insights`) and Auth triggers.

### 5. Running Locally

Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

## 🏛 Architecture Overview

CarbonCanvas strictly adheres to Next.js App Router best practices:
- **Server-First Approach**: UI components are React Server Components by default to minimize client bundle size.
- **Server Actions**: All form submissions, database mutations, and external API calls (Supabase, Gemini) are securely handled via Server Actions in `src/app/actions`.
- **Pure Domain Logic**: The core calculation logic (`services/carbon-calculator.ts` and `services/ecosystem-engine.ts`) is deterministic, heavily unit-tested, and fully decoupled from React or database operations.
- **Append-Only Time Series Data**: Ecosystem states are stored as append-only records rather than upserts, ensuring an accurate historical timeline for insights and trend analysis.

## 📂 Folder Structure

```text
CarbonCanvas/
├── src/
│   ├── app/                # Next.js App Router pages and layouts
│   │   ├── actions/        # Server Actions (auth, carbon entries)
│   │   └── dashboard/      # Protected dashboard routes
│   ├── components/         # Reusable UI components
│   │   ├── carbon/         # Forms and streak cards
│   │   ├── ecosystem/      # Canvas and reflection panels
│   │   └── ui/             # shadcn/ui primitives
│   ├── lib/                # Utility wrappers (Supabase client/middleware)
│   └── services/           # Core domain logic and deterministic engines
├── supabase/               # Database schemas and RLS policies
├── tests/                  # Vitest unit tests
└── docs/                   # Architectural Decision Records (ADRs) and specs
```

## ♿ Accessibility (a11y)

CarbonCanvas is built with inclusivity in mind:
- **Keyboard Navigation**: Fully traversable via keyboard, featuring a dedicated Skip-to-Content link.
- **ARIA Best Practices**: Comprehensive use of `aria-live`, `aria-describedby`, and landmark roles (`<nav>`, `<main>`, `<section>`).
- **Color Contrast**: All text and indicator colors meet or exceed WCAG AA contrast ratios (≥ 4.5:1).
- **Reduced Motion**: Meaningful defaults and safe fallbacks for users preferring reduced motion.

## 🔮 Future Improvements

- **Impact Simulator Full Implementation**: Allow users to interactively run "what-if" scenarios directly on the dashboard.
- **Social Accountability**: Introduce friendly leaderboards and the ability to view generalized ecosystem health maps for communities.
- **Automated Insights Job**: A scheduled background job to generate weekly Gemini-powered holistic reflections based on an aggregated 7-day footprint.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).