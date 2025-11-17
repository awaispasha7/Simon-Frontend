'use client'

import { useEffect, useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { ChatPanel } from '@/components/ChatPanel'
import { SessionsSidebar } from '@/components/SessionsSidebar'
import { ResizableSidebar } from '@/components/ResizableSidebar'
import { useChatStore } from '@/lib/store'
import { useTheme, getThemeColors } from '@/lib/theme-context'
import { sessionSyncManager } from '@/lib/session-sync'
import { MessageSquare } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { sessionApi } from '@/lib/api'

export default function ChatPage() {
  const init = useChatStore(s => s.init)
  const [currentSessionId, setCurrentSessionId] = useState<string>('')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showSidebarHint, setShowSidebarHint] = useState(false)
  const { resolvedTheme } = useTheme()
  const colors = getThemeColors(resolvedTheme)
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => { init() }, [init])

  // Dynamic viewport height for mobile (handles iOS Safari address bar)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null
    
    const setViewportHeight = () => {
      // Clear any pending updates
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      // Debounce to avoid too many updates
      timeoutId = setTimeout(() => {
        // Use the actual viewport height
        const vh = window.innerHeight
        document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`)
      }, 100)
    }

    // Set initial value immediately
    const vh = window.innerHeight
    document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`)

    // Update on resize and orientation change
    window.addEventListener('resize', setViewportHeight)
    window.addEventListener('orientationchange', () => {
      // Wait a bit longer for orientation change to complete
      setTimeout(setViewportHeight, 300)
    })

    // Also update when visual viewport changes (iOS Safari)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', setViewportHeight)
      window.visualViewport.addEventListener('scroll', setViewportHeight)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      window.removeEventListener('resize', setViewportHeight)
      window.removeEventListener('orientationchange', setViewportHeight)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', setViewportHeight)
        window.visualViewport.removeEventListener('scroll', setViewportHeight)
      }
    }
  }, [])


  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Show sidebar hint for new users on mobile
  useEffect(() => {
    const hasSeenSidebarHint = localStorage.getItem('chat_seen_sidebar_hint')
    const isMobile = window.innerWidth < 640
    
    if (!hasSeenSidebarHint && isMobile && isSidebarCollapsed) {
      // Show hint after a delay to let the page load
      const timer = setTimeout(() => {
        setShowSidebarHint(true)
      }, 3000) // 3 second delay
      
      return () => clearTimeout(timer)
    }
  }, [isSidebarCollapsed])

  // Initialize session sync and restore session
  // Only run once on mount - don't restore if we already have values
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Only restore from localStorage if we don't already have session set
        if (!currentSessionId) {
          const stored = localStorage.getItem('chat_session')
          if (stored) {
            const parsed = JSON.parse(stored)
            if (parsed.sessionId) {
              console.log('🔄 [PAGE] Restoring session from localStorage:', parsed.sessionId)
              setCurrentSessionId(parsed.sessionId)
            }
          }
        } else {
          console.log('🔄 [PAGE] Skipping localStorage restore - already have session:', currentSessionId)
        }
        
        // Then initialize the session sync manager asynchronously
        await sessionSyncManager.initialize()
      } catch (error) {
        console.error('Failed to initialize session:', error)
      }
    }

    initializeSession()
  }, []) // Only run once on mount

  // Listen for session cleared and updated events
  useEffect(() => {
    const handleSessionCleared = (event: CustomEvent) => {
      console.log('🔄 Session cleared event received:', event.detail.reason)
      setCurrentSessionId('')
    }

    const handleSessionUpdated = (event: CustomEvent) => {
      console.log('🔄 Session updated event received:', event.detail)
      const { sessionId: newSessionId } = event.detail || {}
      
      if (newSessionId && newSessionId !== currentSessionId) {
        console.log('🔄 Updating current session from event:', newSessionId)
        setCurrentSessionId(newSessionId)
      }
    }

    window.addEventListener('sessionCleared', handleSessionCleared as EventListener)
    window.addEventListener('sessionUpdated', handleSessionUpdated as EventListener)
    
    return () => {
      window.removeEventListener('sessionCleared', handleSessionCleared as EventListener)
      window.removeEventListener('sessionUpdated', handleSessionUpdated as EventListener)
    }
  }, [currentSessionId])


  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    
    // Close sidebar on mobile after selecting a session
    // This provides immediate feedback that the selection worked
    setIsSidebarCollapsed(true)
  }

  const handleSidebarClose = () => {
    setIsSidebarCollapsed(true)
  }

  const handleNewStoryClick = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    
    // Clear session for new story
    try {
      localStorage.removeItem('chat_session')
      console.log('🆕 [PAGE] Cleared localStorage for new story')
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
    }
    
    setCurrentSessionId('')
    
    // Close sidebar on mobile after creating new story
    setIsSidebarCollapsed(true)
  }

  return (
    <>
      {/* Global loader overlay */}
      {authLoading && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center bg-white/70 dark:bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Loading...</span>
          </div>
        </div>
      )}
      <div className={`w-screen overflow-hidden ${colors.background} flex flex-col`} style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
        {/* Topbar - Full width across entire screen */}
        <div className="shrink-0">
          <Topbar />
        </div>
        
        {/* Main Content Area - Below Topbar */}
        <div className="flex-1 flex min-h-0">
          {/* Left Sidebar - Always visible with sessions */}
          <ResizableSidebar 
            minWidth={250} 
            maxWidth={400} 
            defaultWidth={300}
            className={`${colors.sidebarBackground} border-r ${colors.border} flex flex-col`}
            isCollapsed={isSidebarCollapsed}
            onCollapseChange={setIsSidebarCollapsed}
          >
            <div className="flex flex-col h-full">
              {/* Sidebar Content */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <SessionsSidebar 
                  onSessionSelect={handleSessionSelect}
                  currentSessionId={currentSessionId}
                  onClose={handleSidebarClose}
                  onNewStory={handleNewStoryClick}
                />
              </div>
            </div>
          </ResizableSidebar>

          {/* Chat Area */}
          <div className={`flex-1 min-h-0 p-4 ${isSidebarCollapsed ? 'block' : 'hidden sm:block'}`}>
            <div className={`w-full h-full ${colors.cardBackground} ${colors.cardBorder} border rounded-2xl shadow-lg overflow-hidden flex flex-col`}>
              <ChatPanel 
                _sessionId={currentSessionId} 
                onSessionUpdate={(sessionId) => {
                  console.log('🔄 [PAGE] Session updated from ChatPanel:', sessionId)
                  setCurrentSessionId(sessionId)
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Hint for Mobile Users */}
      {showSidebarHint && (
        <div className="fixed inset-0 z-60 pointer-events-none">
          {/* Background overlay */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          
          {/* Hint bubble pointing to sidebar toggle */}
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 pointer-events-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-linear-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">
                    Discover More!
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                    Tap the colorful button to access your previous chats.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowSidebarHint(false)
                        localStorage.setItem('chat_seen_sidebar_hint', 'true')
                      }}
                      className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                    >
                      Got it!
                    </button>
                    <button
                      onClick={() => {
                        setShowSidebarHint(false)
                        setIsSidebarCollapsed(false)
                        localStorage.setItem('chat_seen_sidebar_hint', 'true')
                      }}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                    >
                      Show me
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Arrow pointing to sidebar toggle */}
            <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
              <div className="w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-white dark:border-r-gray-800"></div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

