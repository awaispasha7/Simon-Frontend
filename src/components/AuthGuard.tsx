'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Image from 'next/image'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export function AuthGuard({ children, redirectTo = '/auth/login' }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="relative w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden bg-white shadow-md">
            <Image
              src="/agent-logo.svg"
              alt="Simon's Chatbot"
              width={80}
              height={80}
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-gray-700 dark:text-gray-300 font-medium text-lg">Simon's Chatbot</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
