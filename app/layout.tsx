{/* 'use client' */}
import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ClerkProvider } from '@clerk/nextjs'
import { Navbar } from '@/components/navbar'
import { MobileNav } from '@/components/mobile-nav'
import { QueryProvider } from '@/providers/query-provider'
import { Toaster } from '@/components/ui/sonner'


// export const metadata: Metadata = {
//   title: 'tap&make',
//   description: '憧れのメイク、ワンタップで再現。',
// }

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        {/* Consider adding other meta tags like title, description here if needed */}
      </head>
      <body>
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <Navbar />
              <main className="pb-16 md:pb-0">{children}</main>
              <MobileNav />
              <Toaster />
            </QueryProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
