import Link from 'next/link'
import { Leaf, ArrowRight, Shield, Globe, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const features = [
  {
    icon: Globe,
    title: 'Track Your Footprint',
    desc: 'Log daily transport, food, energy, and shopping to calculate your carbon score.',
  },
  {
    icon: Leaf,
    title: 'Grow Your Ecosystem',
    desc: 'Watch a living virtual world evolve based on the impact of your real choices.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Awareness',
    desc: 'Receive personalized, Gemini-generated narratives that make your impact tangible.',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    desc: 'Your data stays yours — row-level security ensures nobody else can see your logs.',
  },
]

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/15 dark:to-cyan-950/20">
      {/* Nav */}
      <header className="border-b border-emerald-100 dark:border-emerald-900/30 bg-white/60 dark:bg-black/40 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                <Leaf className="h-4 w-4 text-white" aria-hidden="true" />
              </div>
              <span className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
                CarbonCanvas
              </span>
            </div>
            <nav aria-label="Primary navigation" className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                asChild
              >
                <Link href="/signup">
                  Get started <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-6">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Powered by Gemini AI
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 leading-tight mb-6">
            Track your footprint.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              Grow your world.
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-10">
            CarbonCanvas turns your everyday choices into a living virtual ecosystem. See the real
            impact of your actions and receive AI-powered guidance to reduce your footprint.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-base px-8 shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 transition-all duration-200"
              asChild
            >
              <Link href="/signup">
                Start for free <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 text-base px-8 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800 transition-all duration-200"
              asChild
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-24">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-white/70 dark:bg-black/30 p-6 shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-200 backdrop-blur-sm"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/60 transition-colors">
                  <feature.icon
                    className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                </div>
                <h2 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
                  {feature.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-emerald-100 dark:border-emerald-900/30 py-6 text-center text-sm text-muted-foreground/60">
        © {new Date().getFullYear()} CarbonCanvas. Built for PromptWars Challenge 3.
      </footer>
    </div>
  )
}
