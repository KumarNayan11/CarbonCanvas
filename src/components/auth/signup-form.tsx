'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { signUp } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { AuthActionState } from '@/types'

/**
 * Signup form — Client Component using React 19's useActionState.
 * Displays field-level validation errors from the Zod schema
 * and server-level errors from Supabase (e.g. email already taken).
 */
export function SignupForm() {
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(
    signUp,
    undefined
  )

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {/* Server-level error */}
      {state && !state.success && state.message && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {/* Full name */}
      <div className="space-y-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          placeholder="Alex Johnson"
          required
          aria-describedby={
            state && !state.success && state.errors?.full_name
              ? 'full_name-error'
              : undefined
          }
          className="transition-all duration-200 focus:ring-2 focus:ring-emerald-500/40"
        />
        {state && !state.success && state.errors?.full_name && (
          <p id="full_name-error" className="text-sm text-destructive" role="alert">
            {state.errors.full_name[0]}
          </p>
        )}
      </div>

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
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          required
          aria-describedby="password-hint password-error"
          className="transition-all duration-200 focus:ring-2 focus:ring-emerald-500/40"
        />
        <p id="password-hint" className="text-xs text-muted-foreground">
          Must be at least 8 characters with a letter and a number.
        </p>
        {state && !state.success && state.errors?.password && (
          <ul id="password-error" className="space-y-1" role="alert">
            {state.errors.password.map((err) => (
              <li key={err} className="text-sm text-destructive">
                {err}
              </li>
            ))}
          </ul>
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
            Creating account…
          </>
        ) : (
          'Create account'
        )}
      </Button>

      {/* Footer link */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-emerald-600 hover:text-emerald-700 underline underline-offset-4 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </form>
  )
}
