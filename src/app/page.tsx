'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function Home() {
  const { isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Authenticated users go to chat
        router.push('/chat')
      } else {
        // Unauthenticated users can also go to chat to explore
        router.push('/chat')
      }
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading while checking authentication
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-2xl text-white font-bold">SW</span>
        </div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
