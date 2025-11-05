import './globals.css'
import './auth/auth-styles.css'
import { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import { QueryProvider } from '@/components/QueryProvider'
import { AuthProvider } from '@/lib/auth-context'
import { ProfileProvider } from '@/lib/profile-context'
import { ThemeProvider } from '@/lib/theme-context'
import { ToastProvider } from '@/components/ToastProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Stories We Tell',
  description: 'Cinematic intake chatbot',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="grammarly-disable-extension" content="true" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider defaultTheme="dark">
          <QueryProvider>
            <AuthProvider>
              <ProfileProvider>
                <ToastProvider>
                  {children}
                </ToastProvider>
              </ProfileProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
