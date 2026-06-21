# CarbonCanvas Project Rules

## Architecture Rules

- Use Next.js 15 App Router
- Use Server Actions
- No API Routes
- Keep business logic inside services/
- Keep UI logic inside components/

## Database Rules

- Follow schema.sql exactly
- Do not create tables without approval

## UI Rules

- Accessibility first
- Mobile responsive
- Use shadcn/ui

## AI Rules

- Gemini Flash only
- Ecosystem narrative generation handled by `ecosystem-reflection.ts` (deterministic, no API key required)
- Simulator AI narratives handled by `simulator-narrative.ts` (Gemini Flash 2.0; falls back to deterministic templates)

## Repository Constraints

- Keep repository under 10 MB