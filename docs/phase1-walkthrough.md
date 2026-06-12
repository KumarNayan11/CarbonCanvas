# Phase 1: Authentication Foundation — Walkthrough

## What Was Built

Complete Supabase SSR authentication layer with route protection, session persistence, and a protected dashboard.

---

## Files Created / Modified

### `src/lib/supabase/` — Supabase Client Layer

| File | Role |
|------|------|
| [`client.ts`](file:///c:/Users/jain_/Documents/CarbonCanvas/CarbonCanvas/src/lib/supabase/client.ts) | `createBrowserClient` for Client Components |
| [`server.ts`](file:///c:/Users/jain_/Documents/CarbonCanvas/CarbonCanvas/src/lib/supabase/server.ts) | `createServerClient` for Server Components / Actions |
| [`middleware.ts`](file:///c:/Users/jain_/Documents/CarbonCanvas/CarbonCanvas/src/lib/supabase/middleware.ts) | Session refresh helper used by `proxy.ts` |

**Critical note from `@supabase/ssr` v0.12 docs:**
- `getSession()` → reads cookie only, **unverified** — do NOT use for auth guards  
- `getUser()` → calls Supabase Auth server, **verified** — use for all auth checks  
- The middleware helper calls `getUser()` to ensure sessions are valid on every request

### `src/types/index.ts` — TypeScript Types

Consolidated type definitions matching the DB schema exactly:
- `Profile` — mirrors `public.profiles`
- `AuthActionState` — discriminated union for Server Action return values
- `DailyEntry`, `EcosystemState`, `Insight` — stubbed for Phase 2+

### `src/app/actions/auth.ts` — Server Actions

| Action | Description |
|--------|-------------|
| `signUp` | Zod-validates → `supabase.auth.signUp()` → redirect `/dashboard` |
| `signIn` | Zod-validates → `signInWithPassword()` → redirect `/dashboard` |
| `signOut` | `supabase.auth.signOut()` → redirect `/login` |

> No manual profile insert — the `on_auth_user_created` DB trigger handles this.

### `src/proxy.ts` — Route Protection (Next.js 16)

> **Important:** Next.js 16 renamed `middleware.ts` → `proxy.ts` and `middleware()` → `proxy()`. This was caught from the build deprecation warning and fixed.

Logic:
- `isProtectedRoute` (`/dashboard` prefix) + no user → redirect `/login`  
- `isAuthRoute` (`/login`, `/signup`) + user → redirect `/dashboard`
- Always returns `supabaseResponse` (not `NextResponse.next()`) to preserve refreshed cookies

### `src/components/auth/`

| Component | Type | Notes |
|-----------|------|-------|
| [`auth-card.tsx`](file:///c:/Users/jain_/Documents/CarbonCanvas/CarbonCanvas/src/components/auth/auth-card.tsx) | Server | Branded layout wrapper with green gradient |
| [`login-form.tsx`](file:///c:/Users/jain_/Documents/CarbonCanvas/CarbonCanvas/src/components/auth/login-form.tsx) | Client (`'use client'`) | `useActionState(signIn, undefined)` |
| [`signup-form.tsx`](file:///c:/Users/jain_/Documents/CarbonCanvas/CarbonCanvas/src/components/auth/signup-form.tsx) | Client (`'use client'`) | `useActionState(signUp, undefined)` |

`useActionState` is the React 19 / Next.js 15+ pattern replacing `useFormState`. It gives `[state, formAction, isPending]` in one hook.

### Pages

| Route | File | Notes |
|-------|------|-------|
| `/` | [`src/app/page.tsx`](file:///c:/Users/jain_/Documents/CarbonCanvas/CarbonCanvas/src/app/page.tsx) | Redesigned landing page |
| `/login` | [`src/app/login/page.tsx`](file:///c:/Users/jain_/Documents/CarbonCanvas/CarbonCanvas/src/app/login/page.tsx) | Static Server Component |
| `/signup` | [`src/app/signup/page.tsx`](file:///c:/Users/jain_/Documents/CarbonCanvas/CarbonCanvas/src/app/signup/page.tsx) | Static Server Component |
| `/dashboard` | [`src/app/dashboard/page.tsx`](file:///c:/Users/jain_/Documents/CarbonCanvas/CarbonCanvas/src/app/dashboard/page.tsx) | Dynamic Server Component, calls `getUser()` |

---

## Dependencies Installed

All were already present from the previous initialization phase:
- `@supabase/ssr@^0.12.0` ✅  
- `@supabase/supabase-js@^2.108.1` ✅  
- `zod@^4.4.3` ✅

**shadcn/ui components added:**
```bash
npx shadcn@latest add input label card alert --yes
```
Added: `input.tsx`, `label.tsx`, `card.tsx`, `alert.tsx` to `src/components/ui/`

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

> ⚠️ **Never add `SERVICE_ROLE_KEY` to `.env.local` or application code.**  
> It is only for trusted server environments (e.g. Supabase Edge Functions).

Get these values from:  
**Supabase Dashboard → Project Settings → API**

---

## Build & Lint Verification

```
✓ npm run lint      — 0 errors, 0 warnings
✓ npm run build     — Compiled successfully
  ○ /              Static
  ○ /login         Static
  ○ /signup        Static
  ƒ /dashboard     Dynamic (protected)
  ƒ Proxy          Running (session refresh + route guard)
```

---

## Manual Verification Checklist

After running `npm run dev`:

- [ ] **Landing** (`/`) loads with hero section and sign in/up CTAs
- [ ] **`/dashboard`** → redirects to `/login` when not authenticated
- [ ] **Sign Up** (`/signup`) → fill form → account created → redirected to `/dashboard`
- [ ] **Dashboard** → shows your full name, email, join date, "Session verified"
- [ ] **Sign Out** button → signs out → redirects to `/login`
- [ ] **Sign In** (`/login`) → correct credentials → redirected to `/dashboard`
- [ ] **`/login` when authenticated** → redirects to `/dashboard`
- [ ] **Form validation** → submit empty fields → field-level errors appear
- [ ] **Wrong password** → server-level error alert shown (red)
- [ ] **Refresh page on dashboard** → session persists (no flash to login)

---

## Supabase Database Prerequisites

The following must be applied in your Supabase project SQL editor before testing:

```sql
-- Run the full schema from supabase/schema.sql
-- Key piece for auth to work:
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

This creates the `profiles` row automatically on signup.

---

## Architecture Notes

- **No API routes** — all mutations go through Server Actions (`'use server'`)
- **Logout uses `<form action={signOut}>`** — works without JS (progressive enhancement)
- **Dashboard fetches profile** with `.from('profiles').select('*').eq('id', user.id)` — safe because RLS ensures users can only see their own row
- **Proxy pattern** (not Data Access Layer) used for optimistic route guards; the dashboard page still validates with `getUser()` as a second layer of defence

---

## Phase 1.1: Environment Validation & Naming Improvements

### Changes Made

1. **Environment Variable Validation ([env.ts](file:///c:/Users/jain_/Documents/CarbonCanvas/CarbonCanvas/src/lib/supabase/env.ts))**
   - Added a strict environment validator `getSupabaseEnv()` that throws descriptive runtime errors if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are not set.
   - Refactored `client.ts`, `server.ts`, and `middleware.ts` to use this helper, eliminating all unsafe non-null assertions (`!`) for these variables.

2. **Supabase Client Naming Refactoring**
   - Renamed `createClient()` in `client.ts` to `createBrowserClient()`.
   - Renamed `createClient()` in `server.ts` to `createServerClient()`.
   - Updated all import and instantiation references in `src/app/actions/auth.ts` and `src/app/dashboard/page.tsx`.
   - Aliased `@supabase/ssr` imports to avoid name collisions.

### Verification & Testing
- Ran TypeScript compilation (`npx tsc --noEmit`) - passed with 0 errors.
- Ran project lint checks (`npm run lint`) - passed with 0 errors.

