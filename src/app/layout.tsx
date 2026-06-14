import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { SkipToContent } from '@/components/accessibility/skip-to-content'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    template: '%s | CarbonCanvas',
    default: 'CarbonCanvas — Track Your Footprint, Grow Your World',
  },
  description:
    'CarbonCanvas is a carbon footprint awareness platform that turns your daily choices into a living virtual ecosystem.',
  keywords: ['carbon footprint', 'sustainability', 'environment', 'climate', 'eco'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Skip-to-content for keyboard / screen-reader accessibility (WCAG 2.4.1) */}
        <SkipToContent />
        {children}
      </body>
    </html>
  )
}
