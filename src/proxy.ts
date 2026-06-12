import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

/**
 * Next.js 16 Proxy (formerly Middleware) — runs on every matching request
 * before the page renders.
 *
 * Responsibilities:
 * 1. Refreshes expired Supabase access tokens by exchanging the refresh token.
 * 2. Redirects unauthenticated users away from /dashboard (and future protected routes).
 * 3. Redirects authenticated users away from /login and /signup.
 *
 * IMPORTANT: The matcher excludes static files and Next.js internals to avoid
 * running session logic on assets that don't need it.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico
     * - Files with extensions (.png, .svg, .jpg, .ico, .webp, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
