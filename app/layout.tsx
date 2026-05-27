// app/layout.tsx
// Root layout — fonts, global CSS, PWA meta

import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title:       'Home Team',
  description: 'Shared household tasks for couples and families',
  manifest:    '/manifest.json',
  appleWebApp: {
    capable:        true,
    statusBarStyle: 'default',
    title:          'Home Team',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor:   '#F7F3EE',
  width:        'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
