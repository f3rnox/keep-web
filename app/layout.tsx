import type { Metadata } from 'next'
import type { JSX, ReactNode } from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeBootstrapScript } from './components/ThemeBootstrapScript'
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
}

/**
 * Root layout that mounts the global stylesheet, configures fonts, and applies
 * the no-FOUC theme bootstrap script before the app renders.
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
        <ThemeBootstrapScript />
        {children}
      </body>
    </html>
  )
}
