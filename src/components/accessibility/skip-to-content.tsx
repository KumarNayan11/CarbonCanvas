/**
 * @file skip-to-content.tsx
 * @description Keyboard-accessible "Skip to main content" link.
 *
 * Rendered as the very first focusable element in the DOM (placed at the top
 * of <body> in the root layout). Visually hidden until focused, then displayed
 * as a high-contrast pill that lets keyboard users bypass repeated nav elements.
 *
 * WCAG 2.1 — Success Criterion 2.4.1 (Bypass Blocks, Level A)
 */

interface SkipToContentProps {
  /** ID of the landmark to jump to. Defaults to "main-content". */
  targetId?: string
  /** Link label. Defaults to "Skip to main content". */
  label?: string
}

export function SkipToContent({
  targetId = 'main-content',
  label = 'Skip to main content',
}: SkipToContentProps) {
  return (
    <a
      href={`#${targetId}`}
      /**
       * Tailwind utility breakdown:
       *  sr-only              → visually hidden by default (clip + overflow: hidden)
       *  focus:not-sr-only    → undo sr-only when focused
       *  focus:fixed          → take element out of flow so it overlays the page
       *  focus:left-4 / top-4 → top-left corner with breathing room
       *  focus:z-[9999]       → above sticky nav (z-10) and any modals
       *  focus:rounded-lg     → pill shape
       *  focus:bg-emerald-700 → AA-compliant contrast against white text
       *  focus:px-4 / py-2.5 → comfortable click / tap target (≥ 44 px tall)
       *  focus:text-white     → high contrast text
       *  focus:font-semibold  → legible weight
       *  focus:shadow-lg      → depth cue so it visually "pops"
       *  focus:outline-none   → suppress browser default; we have a box-shadow ring instead
       *  focus:ring-2         → visible focus ring on the element itself
       *  focus:ring-white/60  → ring colour that works on the emerald background
       *  focus:ring-offset-2  → gap between ring and element edge
       */
      className={[
        'sr-only',
        'focus:not-sr-only',
        'focus:fixed focus:left-4 focus:top-4 focus:z-[9999]',
        'focus:rounded-lg',
        'focus:bg-emerald-700',
        'focus:px-5 focus:py-2.5',
        'focus:text-white focus:text-sm focus:font-semibold',
        'focus:shadow-lg',
        'focus:outline-none',
        'focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-emerald-700',
        'transition-none', // disable transition so it appears instantly on focus
      ].join(' ')}
    >
      {label}
    </a>
  )
}
