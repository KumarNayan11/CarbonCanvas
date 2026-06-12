import type { Metadata } from 'next'
import { AuthCard } from '@/components/auth/auth-card'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Sign In — CarbonCanvas',
  description: 'Sign in to your CarbonCanvas account to track your carbon footprint.',
}

/**
 * Login page — Server Component.
 * Middleware already redirects authenticated users to /dashboard,
 * so this page is always rendered for unauthenticated visitors.
 */
export default function LoginPage() {
  return (
    <main id="main-content">
      <AuthCard
        title="Welcome back"
        description="Sign in to your account to continue your journey."
      >
        <LoginForm />
      </AuthCard>
    </main>
  )
}
