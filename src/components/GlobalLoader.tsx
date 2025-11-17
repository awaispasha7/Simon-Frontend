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
      const timeout = setTimeout(() => setRouteLoading(false), 800)
      return () => clearTimeout(timeout)
    }
    lastLocationRef.current = current
  }, [pathname, searchParams])

  const show = authLoading || isFetching > 0 || isMutating > 0 || routeLoading
  if (!show) return null

  return (
    <div className="fixed inset-0 z-2000 flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-20 h-20 rounded-full flex items-center justify-center shadow-md overflow-hidden bg-white">
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
