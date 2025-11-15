'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useTheme, getThemeColors } from '@/lib/theme-context'
import { isAdminEmail } from '@/lib/admin-utils'
import { ThemeSelector } from '@/components/ThemeSelector'
import ValidationQueue from '@/components/admin/ValidationQueue'
import AdminStats from '@/components/admin/AdminStats'

export default function AdminPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const colors = getThemeColors(resolvedTheme)
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.push('/auth/login?redirect=/admin')
      return
    }

    const hasAccess = isAdminEmail(user.email)
    setIsAuthorized(hasAccess)

    if (!hasAccess) {
      router.push('/chat')
    }
  }, [user, isLoading, router])

  if (isLoading || isAuthorized === null) {
    return (
      <div className={`min-h-screen! flex! items-center! justify-center! ${colors.background}`}>
        <div className="animate-spin! rounded-full! h-12! w-12! border-b-2! border-blue-600!"></div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className={`min-h-screen! flex! items-center! justify-center! ${colors.background}`}>
        <div className={`text-center! p-8! rounded-lg! border! ${colors.border}`}>
          <h1 className={`text-2xl! font-bold! mb-4! ${colors.text}`}>Access Denied</h1>
          <p className={colors.textSecondary}>You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen! ${colors.background}`}>
      {/* Header */}
      <div className={`border-b! ${colors.border} ${colors.sidebarBackground} shadow-sm!`}>
        <div className="max-w-7xl! mx-auto! px-6! sm:px-8! lg:px-10!">
          <div className="flex! justify-between! items-center! py-8!">
            <div>
              <h1 className={`text-3xl! font-bold! ${colors.text} mb-2!`}>Admin Dashboard</h1>
              <p className={`${colors.textSecondary} text-sm!`}>Content Validation Management</p>
            </div>
            <div className="flex! items-center! gap-6!">
              <span className={`text-sm! ${colors.textSecondary} font-medium! whitespace-nowrap!`}>
                Welcome, {user?.display_name || user?.email}
              </span>
              {/* Theme Selector */}
              <ThemeSelector />
              <button
                onClick={() => router.push('/chat')}
                className={`px-5! py-2.5! text-sm! rounded-lg! border-2! ${colors.border} ${colors.textSecondary} hover:${colors.text} transition-all! hover:border-blue-500! hover:bg-blue-500/10! font-medium! whitespace-nowrap! hover:cursor-pointer!`}
              >
                Back to Chat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl! mx-auto! px-6! sm:px-8! lg:px-10! py-10!">
        <div className="grid! grid-cols-1! lg:grid-cols-4! gap-8!">
          {/* Stats Sidebar */}
          <div className="lg:col-span-1!">
            <AdminStats />
          </div>

          {/* Validation Queue */}
          <div className="lg:col-span-3!">
            <ValidationQueue />
          </div>
        </div>
      </div>
    </div>
  )
}
