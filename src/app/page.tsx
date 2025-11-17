'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Image from 'next/image'

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
    <div className="min-h-screen flex items-center justify-center bg-white">
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
        <p className="text-gray-700 font-medium text-lg">Simon's Chatbot</p>
      </div>
    </div>
  )
}
