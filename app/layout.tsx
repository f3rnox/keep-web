import type { Metadata } from 'next'
import type { JSX, ReactNode } from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
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
  title: 'Node Keep',
  description: 'A Node.JS Note-Taking Web UI',
}

/**
 * Root layout that mounts the global stylesheet, configures fonts, and
 * provides the html/body shell required by the Next.js App Router.
 *
 * @param props.children The active page rendered inside the body.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>): JSX.Element {
  return (
    <html
      lang='en'
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className='flex min-h-full flex-col'>{children}</body>
    </html>
  )
}
