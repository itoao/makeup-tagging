import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ClerkProvider } from '@clerk/nextjs'
import { Navbar } from '@/components/navbar'
import { QueryProvider } from '@/providers/query-provider'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'tap&make',
  description: '憧れのメイク、ワンタップで再現。',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="ja">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <body>
            <QueryProvider>
              <Navbar />
              <main>{children}</main>
              <Toaster />
            </QueryProvider>
          </body>
        </ThemeProvider>
      </html>
    </ClerkProvider>
  )
}
