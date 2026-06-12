import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Leaf, LogOut, User, Mail, Calendar, Shield } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { Profile } from '@/types'

export const metadata: Metadata = {
  title: 'Dashboard — CarbonCanvas',
  description: 'Your personal carbon footprint dashboard.',
}

/**
 * Dashboard page — Server Component, protected by middleware.
 *
 * We call getUser() here (not getSession()) as per @supabase/ssr docs:
 * getSession() returns unverified cookie data and must NOT be used for auth.
 */
export default async function DashboardPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  // Belt-and-suspenders: middleware should have caught this, but guard anyway.
  if (userError || !user) {
    redirect('/login')
  }

  // Fetch the user's profile (created automatically by the DB trigger)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  const displayName = profile?.full_name ?? user.email ?? 'Explorer'
  const joinedAt = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown'

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/15 dark:to-cyan-950/20">
      {/* Navigation */}
      <header className="border-b border-emerald-100 dark:border-emerald-900/30 bg-white/70 dark:bg-black/40 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                <Leaf className="h-4 w-4 text-white" aria-hidden="true" />
              </div>
              <span className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
                CarbonCanvas
              </span>
            </div>

            {/* Sign out */}
            <form action={signOut}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="gap-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20 transition-all"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Explorer'} 🌿
          </h1>
          <p className="mt-1 text-muted-foreground">
            Your environmental dashboard is ready. Carbon tracking features are coming soon.
          </p>
        </div>

        {/* Profile card */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-full md:col-span-1 border-emerald-100 dark:border-emerald-900/40 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                Your Profile
              </CardTitle>
              <CardDescription>Account details from your profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar placeholder */}
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xl font-bold shadow-md">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{displayName}</p>
                  <p className="text-sm text-muted-foreground">CarbonCanvas Member</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                  <span className="text-muted-foreground truncate">{profile?.email ?? user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                  <span className="text-muted-foreground">Joined {joinedAt}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    Session verified
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coming soon cards */}
          {[
            {
              title: 'Carbon Score',
              desc: 'Daily activity tracking',
              icon: '🌍',
              teaser: 'Track your daily transport, food, and energy usage.',
            },
            {
              title: 'Ecosystem Health',
              desc: 'Virtual environment',
              icon: '🌲',
              teaser: 'Watch your forest, water, and biodiversity grow with better choices.',
            },
            {
              title: 'AI Insights',
              desc: 'Personalized recommendations',
              icon: '✨',
              teaser: 'Get Gemini-powered awareness narratives tailored to your impact.',
            },
          ].map((feature) => (
            <Card
              key={feature.title}
              className="border-dashed border-emerald-200 dark:border-emerald-900/40 bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/30 transition-colors duration-200"
            >
              <CardHeader>
                <div className="text-3xl mb-1" aria-hidden="true">
                  {feature.icon}
                </div>
                <CardTitle className="text-base">{feature.title}</CardTitle>
                <CardDescription>{feature.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.teaser}</p>
                <div className="mt-3 inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Coming in Phase 2
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
