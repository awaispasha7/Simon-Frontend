"use client"

import { useAuth } from '@/lib/auth-context'
import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Image from 'next/image'

export function GlobalLoader() {
  const { isLoading: authLoading } = useAuth()
  const isFetching = useIsFetching()
  const isMutating = useIsMutating()

  // Route-change aware loading
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastLocationRef = useRef<string | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)

  useEffect(() => {
    const current = `${pathname}?${searchParams?.toString() || ''}`
    if (lastLocationRef.current && lastLocationRef.current !== current) {
      // Start a brief route-loading overlay; will auto-clear or be superseded by queries
      setRouteLoading(true)
      const timeout = setTimeout(() => setRouteLoading(false), 1500)
      return () => clearTimeout(timeout)
    }
    lastLocationRef.current = current
  }, [pathname, searchParams])

  // Show loader during auth loading, data fetching, mutations, or route changes
  const show = authLoading || isFetching > 0 || isMutating > 0 || routeLoading
  
  if (!show) return null

  return (
    <div className="fixed inset-0 z-2000 flex items-center justify-center bg-white/80 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg overflow-hidden bg-white animate-bounce-slow">
          <div className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-spin-slow"></div>
          <Image
            src="/agent-logo.svg"
            alt="Simon's Chatbot"
            width={64}
            height={64}
            className="w-full h-full object-contain animate-pulse-slow"
          />
        </div>
        <p className="text-gray-600 dark:text-gray-300 font-medium text-center animate-pulse">Simon's Chatbot</p>
      </div>
    </div>
  )
}
