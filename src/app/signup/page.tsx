import type { Metadata } from 'next'
import { AuthCard } from '@/components/auth/auth-card'
import { SignupForm } from '@/components/auth/signup-form'

export const metadata: Metadata = {
  title: 'Create Account — CarbonCanvas',
  description: 'Create a free CarbonCanvas account and start tracking your environmental impact.',
}

/**
 * Signup page — Server Component.
 * Middleware handles authenticated redirect, so this is always for new users.
 */
export default function SignupPage() {
  return (
    <main id="main-content">
      <AuthCard
        title="Create your account"
        description="Start tracking your carbon footprint and growing your virtual ecosystem."
      >
        <SignupForm />
      </AuthCard>
    </main>
  )
}
