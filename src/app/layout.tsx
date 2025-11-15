import './globals.css'
import './auth/auth-styles.css'
import { ReactNode, Suspense } from 'react'
import { Inter } from 'next/font/google'
import { QueryProvider } from '@/components/QueryProvider'
import { AuthProvider } from '@/lib/auth-context'
import { ProfileProvider } from '@/lib/profile-context'
import { ThemeProvider } from '@/lib/theme-context'
import { ToastProvider } from '@/components/ToastProvider'
import { GlobalLoader } from '@/components/GlobalLoader'

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
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <ProfileProvider>
                <ToastProvider>
                  <Suspense fallback={null}>
                    <GlobalLoader />
                  </Suspense>
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
