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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 animate-in fade-in duration-500">
        <div className="text-center">
          <div className="relative w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden bg-white shadow-lg animate-bounce-slow">
            <div className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-spin-slow"></div>
            <Image
              src="/agent-logo.svg"
              alt="Simon's Chatbot"
              width={64}
              height={64}
              className="w-full h-full object-contain animate-pulse-slow"
            />
          </div>
          <p className="text-gray-600 font-medium animate-pulse">Simon's Chatbot</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
