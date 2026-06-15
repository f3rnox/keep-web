import type { Metadata, Viewport } from 'next'
import type { JSX, ReactNode } from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
import { ServiceWorkerRegistration } from './components/ServiceWorkerRegistration'
import { SettingToast } from './components/SettingToast'
import { SupabaseSyncProvider } from './components/SupabaseSyncProvider'
import { ThemeBootstrap } from './components/ThemeBootstrap'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'KeepSpark',
  description: 'KeepSpark — a minimalist note-taking web UI',
  applicationName: 'KeepSpark',
  appleWebApp: {
    capable: true,
    title: 'KeepSpark',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

/**
 * Root layout that mounts the global stylesheet, configures fonts, and boots
 * the theme before paint via a client layout effect.
 *
 * @param props.children The active page rendered inside the body.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>): JSX.Element {
  return (
    <html
      lang='en'
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} scrollbar-thin h-full antialiased [text-rendering:optimizeLegibility]`}
    >
      <body className='flex min-h-full flex-col bg-canvas font-sans text-foreground selection:bg-foreground selection:text-canvas'>
        <ThemeBootstrap />
        <ServiceWorkerRegistration />
        <SupabaseSyncProvider />
        <SettingToast />
        {children}
      </body>
    </html>
  )
}
