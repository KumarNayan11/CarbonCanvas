import { Leaf } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AuthCardProps {
  title: string
  description: string
  children: React.ReactNode
}

/**
 * Shared layout card for auth pages (login, signup).
 * Purely a presentation Server Component — no state.
 */
export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/30 p-4">
      <div className="w-full max-w-md">
        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/25">
            <Leaf className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-emerald-800 dark:text-emerald-300">
            CarbonCanvas
          </span>
        </div>

        <Card className="border border-emerald-100 dark:border-emerald-900/50 shadow-xl shadow-emerald-900/5 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold">{title}</CardTitle>
            <CardDescription className="text-muted-foreground">{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>

        {/* Subtle tagline */}
        <p className="mt-6 text-center text-xs text-muted-foreground/70">
          Track your footprint. Grow your world.
        </p>
      </div>
    </div>
  )
}
