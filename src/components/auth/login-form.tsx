'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { signIn } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { AuthActionState } from '@/types'

/**
 * Login form — Client Component so we can use useActionState for
 * pending state, inline field errors, and loading feedback.
 */
export function LoginForm() {
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(
    signIn,
    undefined
  )

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {/* Server-level error (e.g. wrong credentials) */}
      {state && !state.success && state.message && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          aria-describedby={
            state && !state.success && state.errors?.email
              ? 'email-error'
              : undefined
          }
          className="transition-all duration-200 focus:ring-2 focus:ring-emerald-500/40"
        />
        {state && !state.success && state.errors?.email && (
          <p id="email-error" className="text-sm text-destructive" role="alert">
            {state.errors.email[0]}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          aria-describedby={
            state && !state.success && state.errors?.password
              ? 'password-error'
              : undefined
          }
          className="transition-all duration-200 focus:ring-2 focus:ring-emerald-500/40"
        />
        {state && !state.success && state.errors?.password && (
          <p id="password-error" className="text-sm text-destructive" role="alert">
            {state.errors.password[0]}
          </p>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 disabled:opacity-60"
        aria-busy={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Signing in…
          </>
        ) : (
          'Sign in'
        )}
      </Button>

      {/* Footer link */}
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-medium text-emerald-600 hover:text-emerald-700 underline underline-offset-4 transition-colors"
        >
          Create one
        </Link>
      </p>
    </form>
  )
}
