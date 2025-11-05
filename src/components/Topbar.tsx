'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Film, Plus, LogOut } from 'lucide-react'
import { ThemeSelector } from './ThemeSelector'
import { useTheme, getThemeColors } from '@/lib/theme-context'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

export function Topbar() {
  const { resolvedTheme } = useTheme()
  const colors = getThemeColors(resolvedTheme)
  const { user, logout, isAuthenticated } = useAuth()
  const router = useRouter()
  const [_, setTick] = useState(0)

  const handleNewChat = () => {
    try { localStorage.removeItem('stories_we_tell_session') } catch {}
    setTick(t => t + 1)
    window.location.reload()
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <header className={`flex items-center justify-between px-6 sm:px-10 md:px-12 lg:px-16 h-16 border-b ${colors.border} ${colors.backgroundSecondary} shrink-0 relative z-50`}>
      <div className={`flex items-center gap-4 ${colors.textSecondary}`}>
        <div className={cn(
          "p-2.5 rounded-lg border",
          resolvedTheme === 'light'
            ? "bg-gray-900 border-gray-800"
            : "bg-zinc-900 border border-zinc-800"
        )}>
          <Film className={cn(
            "h-5 w-5",
            resolvedTheme === 'light' ? "text-gray-100" : "text-zinc-300"
          )} />
        </div>
        <div className="pl-2 sm:pl-3">
          <h1 className={`font-semibold text-base sm:text-lg ${colors.text} tracking-tight`}>Coach Strategist AI</h1>
          <p className={`text-xs ${colors.textTertiary} font-light hidden sm:block`}>Scripts, strategy, and emotional storytelling</p>
        </div>
      </div>
      <div className="flex items-center gap-3 pr-4 sm:pr-6 md:pr-8">
        {isAuthenticated && user && (
          <div className={`text-xs ${colors.textSecondary} hidden sm:block`}>
            <span className={colors.textTertiary}>Logged in as </span>
            <span className={colors.text}>{user.display_name || user.username || 'User'}</span>
          </div>
        )}
        <ThemeSelector />
        <button
          onClick={handleNewChat}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg ${colors.buttonPrimary} transition-all duration-200 group`}
          title="Start a new chat"
        >
          <Plus className="h-4 w-4 transition-colors" />
          <span className={`text-sm font-medium`}>
            New Chat
          </span>
        </button>
        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${colors.buttonSecondary || 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'} transition-all duration-200`}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
            <span className={`text-sm font-medium hidden sm:inline ${colors.text}`}>
              Logout
            </span>
          </button>
        )}
      </div>
    </header>
  )
}