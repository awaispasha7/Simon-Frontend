'use client'

import { useEffect, useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { ChatPanel } from '@/components/ChatPanel'
import { SidebarDossier } from '@/components/SidebarDossier'
import { SessionsSidebar } from '@/components/SessionsSidebar'
import { ResizableSidebar } from '@/components/ResizableSidebar'
import { LoginPromptModal } from '@/components/LoginPromptModal'
import { ProjectCreationModal } from '@/components/ProjectCreationModal'
import { useChatStore } from '@/lib/store'
import { DossierProvider } from '@/lib/dossier-context'
import { useTheme, getThemeColors } from '@/lib/theme-context'
import { sessionSyncManager } from '@/lib/session-sync'
import { MessageSquare, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { projectApi, sessionApi } from '@/lib/api'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export default function ChatPage() {
  const init = useChatStore(s => s.init)
  const [activeTab, setActiveTab] = useState<'sessions' | 'dossier'>('sessions')
  const [currentSessionId, setCurrentSessionId] = useState<string>('')
  const [currentProjectId, setCurrentProjectId] = useState<string>('')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginModalTrigger, setLoginModalTrigger] = useState<'new-content' | 'session-start' | 'content-complete'>('session-start')
  const [showSidebarHint, setShowSidebarHint] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [projectModalRequired, setProjectModalRequired] = useState(false)
  const { resolvedTheme } = useTheme()
  const colors = getThemeColors(resolvedTheme)
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Fetch user projects to check availability
  const { data: projectsData, isLoading: isProjectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      if (!isAuthenticated || !user?.user_id) return { projects: [], count: 0 }
      try {
        return await projectApi.getProjects()
      } catch (error) {
        console.error('Failed to fetch projects:', error)
        return { projects: [], count: 0 }
      }
    },
    enabled: isAuthenticated && !!user?.user_id,
    staleTime: 30000, // Cache for 30 seconds
  })

  const projects = projectsData?.projects || []

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

  // Check if current project still exists (was deleted)
  // Only run when projects have finished loading to avoid race conditions with new projects
  useEffect(() => {
    if (isAuthenticated && user && currentProjectId && projects.length > 0 && !isProjectsLoading) {
      const projectExists = projects.some(p => p.project_id === currentProjectId)
      if (!projectExists) {
        // Current project was deleted - clear everything
        console.log('🗑️ [PAGE] Current project was deleted, clearing selection')
        setCurrentProjectId('')
        setCurrentSessionId('')
        try {
          localStorage.removeItem('chat_session')
        } catch (error) {
          console.error('Failed to clear localStorage:', error)
        }
      }
    }
  }, [isAuthenticated, user, currentProjectId, projects, isProjectsLoading])

  // Auto-select most recent project for authenticated users if none selected
  useEffect(() => {
    if (isAuthenticated && user && projects.length > 0 && !currentProjectId && !currentSessionId) {
      // User has projects but no project/session selected - auto-select most recent
      const mostRecentProject = projects[0] // Already ordered by updated_at DESC
      console.log('🔄 [PAGE] Auto-selecting most recent project:', mostRecentProject.name, mostRecentProject.project_id)
      setCurrentProjectId(mostRecentProject.project_id)
      
      // Update localStorage to persist the selection
      try {
        const stored = localStorage.getItem('chat_session')
        if (stored) {
          const parsed = JSON.parse(stored)
          parsed.projectId = mostRecentProject.project_id
          localStorage.setItem('chat_session', JSON.stringify(parsed))
        } else {
          localStorage.setItem('chat_session', JSON.stringify({
            projectId: mostRecentProject.project_id
          }))
        }
      } catch (error) {
        console.error('Failed to update localStorage with project:', error)
      }
    }
    
    // Don't auto-show modal on page load - let user interact with the page
    // Modal will show when user tries to send a message (handled in ChatPanel)
  }, [isAuthenticated, user, projects, currentProjectId, currentSessionId, showProjectModal, isProjectsLoading])

  // Show login modal for anonymous users at session start
  useEffect(() => {
    // Only show modal for anonymous users (not authenticated)
    if (!isAuthenticated && !user) {
      // Check if user has seen the modal before (localStorage)
      const hasSeenModal = localStorage.getItem('chat_seen_login_modal')
      // Temporarily comment out for testing - uncomment for production
      if (!hasSeenModal) {
      // if (true) { // Always show for testing
        // Show modal after a short delay to let the page load
        const timer = setTimeout(() => {
          setLoginModalTrigger('session-start')
          setShowLoginModal(true)
        }, 2000) // 2 second delay
        
        return () => clearTimeout(timer)
      }
    }
  }, [isAuthenticated, user])

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
        // Only restore from localStorage if we don't already have session/project set
        // This prevents overriding newly created projects
        if (!currentSessionId && !currentProjectId) {
          const stored = localStorage.getItem('chat_session')
          if (stored) {
            const parsed = JSON.parse(stored)
            if (parsed.sessionId) {
              console.log('🔄 [PAGE] Restoring session from localStorage:', parsed.sessionId)
              setCurrentSessionId(parsed.sessionId)
              if (parsed.projectId) {
                setCurrentProjectId(parsed.projectId)
              }
            }
          }
        } else {
          console.log('🔄 [PAGE] Skipping localStorage restore - already have session/project:', { currentSessionId, currentProjectId })
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
      setCurrentProjectId('')
    }

    const handleSessionUpdated = (event: CustomEvent) => {
      console.log('🔄 Session updated event received:', event.detail)
      const { sessionId: newSessionId, projectId: newProjectId } = event.detail || {}
      
      if (newSessionId && newSessionId !== currentSessionId) {
        console.log('🔄 Updating current session from event:', newSessionId)
        setCurrentSessionId(newSessionId)
        if (newProjectId) {
          setCurrentProjectId(newProjectId)
        }
      }
    }

    window.addEventListener('sessionCleared', handleSessionCleared as EventListener)
    window.addEventListener('sessionUpdated', handleSessionUpdated as EventListener)
    
    return () => {
      window.removeEventListener('sessionCleared', handleSessionCleared as EventListener)
      window.removeEventListener('sessionUpdated', handleSessionUpdated as EventListener)
    }
  }, [currentSessionId])


  const handleSessionSelect = (sessionId: string, projectId?: string) => {
    setCurrentSessionId(sessionId)
    setCurrentProjectId(projectId || '')
    
    // Close sidebar on mobile after selecting a session
    // This provides immediate feedback that the selection worked
    setIsSidebarCollapsed(true)
  }

  const handleSidebarClose = () => {
    setIsSidebarCollapsed(true)
  }

  // Modal handlers
  const handleCloseModal = () => {
    setShowLoginModal(false)
    // Mark that user has seen the modal
    localStorage.setItem('chat_seen_login_modal', 'true')
  }

  const handleSignup = () => {
    setShowLoginModal(false)
    router.push('/auth/signup')
  }

  const handleLogin = () => {
    setShowLoginModal(false)
    router.push('/auth/login')
  }

  const handleNewStoryClick = async () => {
    if (!isAuthenticated) {
      setLoginModalTrigger('new-content')
      setShowLoginModal(true)
    } else {
      // For authenticated users, check if they have projects
      if (projects.length === 0) {
        // No projects - require creating one
        console.log('🆕 [PAGE] No projects found, requiring project creation')
        setProjectModalRequired(true)
        setShowProjectModal(true)
        return
      }

      // User has projects - clear session but keep most recent project selected
      // Auto-select the most recent project for convenience
      const mostRecentProject = projects[0] // Projects are ordered by updated_at DESC
      
      try {
        localStorage.removeItem('chat_session')
        console.log('🆕 [PAGE] Cleared localStorage for new story')
      } catch (error) {
        console.error('Failed to clear localStorage:', error)
      }
      
      setCurrentSessionId('')
      setCurrentProjectId(mostRecentProject.project_id) // Auto-select most recent project
      
      console.log('🆕 [PAGE] Auto-selected project:', mostRecentProject.name, mostRecentProject.project_id)
      
      // Close sidebar on mobile after creating new story
      setIsSidebarCollapsed(true)
    }
  }

  // Handle project creation success
  const handleProjectCreated = async (projectId: string, projectName: string) => {
    try {
      console.log('🚀 [PAGE] handleProjectCreated CALLED with:', { projectId, projectName })
      console.log('✅ [PAGE] Project created:', projectName, projectId)
      setShowProjectModal(false)
      setProjectModalRequired(false)
      
      // CRITICAL: Refetch projects FIRST to ensure the new project is in the list
      // This prevents race conditions where deletion check runs before project appears
      console.log('🔄 [PAGE] Starting projects refetch...')
      await queryClient.invalidateQueries({ queryKey: ['projects'] })
      await queryClient.refetchQueries({ queryKey: ['projects'] })
      await queryClient.invalidateQueries({ queryKey: ['projectsSidebar'] })
      await queryClient.refetchQueries({ queryKey: ['projectsSidebar'] })
      console.log('🔄 [PAGE] Projects refreshed before setting state')
      
      // Clear old session data first
      localStorage.removeItem('chat_session')
      console.log('🧹 [PAGE] Cleared old localStorage session')
      
      // Create a session for this new project automatically
      console.log('🆕 [PAGE] Auto-creating session for new project:', projectId)
      const sessionResponse = await sessionApi.getOrCreateSession(undefined, projectId) as { 
        success?: boolean
        session_id?: string
        project_id?: string
        is_authenticated?: boolean
      }
      
      console.log('📦 [PAGE] Session response:', sessionResponse)
      
      if (sessionResponse && sessionResponse.session_id) {
        console.log('✅ [PAGE] Auto-created session:', sessionResponse.session_id)
        
        // Store in localStorage FIRST before setting state
        try {
          localStorage.setItem('chat_session', JSON.stringify({
            sessionId: sessionResponse.session_id,
            projectId: projectId,
            isAuthenticated: true
          }))
          console.log('💾 [PAGE] Stored new session in localStorage')
        } catch (e) {
          console.error('Failed to store session in localStorage:', e)
        }
        
        // Now set state AFTER projects are refetched - ensures deletion check won't trigger
        setCurrentProjectId(projectId)
        setCurrentSessionId(sessionResponse.session_id)
        console.log('🆕 [PAGE] Switched to new project:', projectName, projectId)
        console.log('🆕 [PAGE] With session:', sessionResponse.session_id)
      } else {
        console.warn('⚠️ [PAGE] Failed to auto-create session - response:', sessionResponse)
        // Still set the project even if session creation failed
        setCurrentProjectId(projectId)
        setCurrentSessionId('')
      }
      
      // Close sidebar on mobile
      setIsSidebarCollapsed(true)
      console.log('✅ [PAGE] handleProjectCreated COMPLETED successfully')
    } catch (error) {
      console.error('❌ [PAGE] handleProjectCreated ERROR:', error)
      // Still set the project even if there was an error
      setCurrentProjectId(projectId)
      setCurrentSessionId('')
      throw error // Re-throw so caller knows it failed
    }
  }

  return (
    <DossierProvider>
      {/* Global loader overlay */}
      {(authLoading || (isAuthenticated && isProjectsLoading)) && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center bg-white/70 dark:bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
              {/* Enhanced Sidebar Switch */}
              <div className="sidebar-switch-container shrink-0">
                <button
                  onClick={() => setActiveTab('sessions')}
                  className={cn(
                    "sidebar-switch-button",
                    activeTab === 'sessions' && "active"
                  )}
                >
                  <MessageSquare className="sidebar-switch-icon" />
                  Chats
                </button>
                <button
                  onClick={() => setActiveTab('dossier')}
                  className={cn(
                    "sidebar-switch-button",
                    activeTab === 'dossier' && "active"
                  )}
                >
                  <FileText className="sidebar-switch-icon" />
                  Dossier
                </button>
              </div>
              
              {/* Sidebar Content */}
              <div className="flex-1 min-h-0 overflow-hidden">
              {activeTab === 'sessions' ? (
                <SessionsSidebar 
                  onSessionSelect={handleSessionSelect}
                  currentSessionId={currentSessionId}
                  currentProjectId={currentProjectId}
                  onClose={handleSidebarClose}
                  onNewStory={handleNewStoryClick}
                  onNewProject={() => {
                    // Project created callback - can trigger new chat in the new project
                    console.log('✅ New project created, ready for new chat')
                  }}
                  onProjectCreated={handleProjectCreated}
                />
              ) : (
                <SidebarDossier 
                  sessionId={currentSessionId}
                  projectId={currentProjectId}
                  onClose={handleSidebarClose}
                />
              )}
              </div>
            </div>
          </ResizableSidebar>

          {/* Chat Area - Always show so users can interact and get prompted to create project */}
          <div className={`flex-1 min-h-0 p-4 ${isSidebarCollapsed ? 'block' : 'hidden sm:block'}`}>
            <div className={`w-full h-full ${colors.cardBackground} ${colors.cardBorder} border rounded-2xl shadow-lg overflow-hidden flex flex-col`}>
              <ChatPanel 
                _sessionId={currentSessionId} 
                _projectId={currentProjectId} 
                onSessionUpdate={(sessionId, projectId) => {
                  console.log('🔄 [PAGE] Session updated from ChatPanel:', sessionId)
                  setCurrentSessionId(sessionId)
                  if (projectId) {
                    setCurrentProjectId(projectId)
                  }
                }}
                onShowProjectModal={() => {
                  console.log('🆕 [PAGE] Showing project modal from ChatPanel')
                  setProjectModalRequired(true)
                  setShowProjectModal(true)
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={showLoginModal}
        onClose={handleCloseModal}
        onSignup={handleSignup}
        onLogin={handleLogin}
        trigger={loginModalTrigger}
      />

      {/* Project Creation Modal - Only show when explicitly triggered (e.g., message send or New Project button) */}
      <ProjectCreationModal
        isOpen={showProjectModal}
        onClose={() => {
          // Always allow closing - user can navigate freely
          setShowProjectModal(false)
          setProjectModalRequired(false)
        }}
        onProjectCreated={handleProjectCreated}
        isRequired={false} // Never block - user should always be able to navigate
      />

      {/* Sidebar Hint for Mobile Users */}
      {showSidebarHint && (
        <div className="fixed inset-0 z-60 pointer-events-none">
          {/* Background overlay */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          
          {/* Hint bubble pointing to sidebar toggle */}
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 pointer-events-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">
                    Discover More!
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                    Tap the colorful button to access your content dossier and previous chats.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowSidebarHint(false)
                        localStorage.setItem('chat_seen_sidebar_hint', 'true')
                      }}
                      className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
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
    </DossierProvider>
  )
}

