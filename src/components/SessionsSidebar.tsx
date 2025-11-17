'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { sessionApi } from '@/lib/api'
import { useTheme, getThemeColors } from '@/lib/theme-context'
import { useAuth } from '@/lib/auth-context'
import { useToastContext } from '@/components/ToastProvider'
import { MessageSquare, Trash2, LogIn, UserPlus, ChevronLeft, Plus } from 'lucide-react'

interface Session {
  session_id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
  last_message_at: string
  is_active: boolean
  first_message?: string
  message_count?: number
}

interface SessionsSidebarProps {
  onSessionSelect: (sessionId: string) => void
  currentSessionId?: string
  onClose?: () => void
  onNewStory?: () => void
}

export function SessionsSidebar({ 
  onSessionSelect, 
  currentSessionId, 
  onClose, 
  onNewStory
}: SessionsSidebarProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const colors = getThemeColors(resolvedTheme)
  const { isAuthenticated, user } = useAuth()
  const toast = useToastContext()
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false)

  // Listen for session updates to refresh the sessions list
  useEffect(() => {
    const handleSessionUpdate = () => {
      console.log('🔄 Session updated, refreshing sessions list')
      queryClient.invalidateQueries({ queryKey: ['sessionsSidebar'] })
      queryClient.refetchQueries({ queryKey: ['sessionsSidebar'] })
    }

    const handleSessionCreated = () => {
      console.log('🆕 New session created, refreshing sessions list')
      queryClient.invalidateQueries({ queryKey: ['sessionsSidebar'] })
      queryClient.refetchQueries({ queryKey: ['sessionsSidebar'] })
    }

    window.addEventListener('sessionUpdated', handleSessionUpdate)
    window.addEventListener('sessionCreated', handleSessionCreated)
    return () => {
      window.removeEventListener('sessionUpdated', handleSessionUpdate)
      window.removeEventListener('sessionCreated', handleSessionCreated)
    }
  }, [queryClient])

  // Fetch sessions for authenticated users
  const { data: sessionsData, isLoading, error } = useQuery({
    queryKey: ['sessionsSidebar'],
    queryFn: async () => {
      try {
        if (!user?.user_id) {
          await new Promise(resolve => setTimeout(resolve, 100))
          if (!user?.user_id) {
            throw new Error('User not loaded yet')
          }
        }
        
        const result = await sessionApi.getSessions(100) // Get up to 100 sessions
        console.log('📋 Sessions result:', result)
        
        // Handle different response formats
        const sessions: Session[] = Array.isArray(result) 
          ? result 
          : (result && typeof result === 'object' && 'sessions' in result)
            ? (result as { sessions: Session[] }).sessions
            : []
        
        // Enhance sessions with first USER message and count
        const sessionsWithDetails = await Promise.all(
          sessions.map(async (session) => {
            try {
              // Fetch more messages to find the first user message
              const messagesResponse = await sessionApi.getSessionMessages(session.session_id, 50, 0)
              const messages = (messagesResponse as { messages?: Array<{ role?: string; content?: string }> })?.messages || []
              
              // Find the first user message (not assistant or system)
              const firstUserMessage = messages.find((msg: { role?: string; content?: string }) => 
                msg.role === 'user' && msg.content
              )?.content
              
              return {
                ...session,
                first_message: firstUserMessage,
                message_count: messages.length
              }
            } catch (error) {
              console.warn(`Failed to fetch messages for session ${session.session_id}:`, error)
              return {
                ...session,
                first_message: undefined,
                message_count: 0
              }
            }
          })
        )
        
        // Filter out empty sessions
        return sessionsWithDetails.filter(s => s.message_count && s.message_count > 0)
      } catch (error) {
        console.error('❌ Error fetching sessions:', error)
        toast.error(
          'Load Failed',
          'Failed to load your sessions. Please try again.',
          4000
        )
        return []
      }
    },
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 0,
    enabled: isAuthenticated && !!user?.user_id,
    retry: false,
  })

  // Ensure sessions is always an array
  const sessions: Session[] = Array.isArray(sessionsData) 
    ? sessionsData 
    : []

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => sessionApi.deleteSession(sessionId),
    onMutate: async (sessionId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['sessionsSidebar'] })
      
      // Snapshot the previous value
      const previousSessions = queryClient.getQueryData(['sessionsSidebar'])
      
      // Optimistically update to remove the session
      queryClient.setQueryData(['sessionsSidebar'], (old: unknown) => {
        if (!old) return old
        const oldArr = old as Session[]
        return oldArr.filter(s => s.session_id !== sessionId)
      })
      
      return { previousSessions }
    },
    onSuccess: () => {
      // Invalidate and immediately refetch sessions to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['sessionsSidebar'] })
      queryClient.refetchQueries({ queryKey: ['sessionsSidebar'] })
    },
    onError: (error, sessionId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSessions) {
        queryClient.setQueryData(['sessionsSidebar'], context.previousSessions)
      }
      console.error('Delete session mutation error:', error)
      toast.error(
        'Delete Failed',
        'An unexpected error occurred while deleting the session.',
        5000
      )
    }
  })

  const handleDeleteSession = (sessionId: string) => {
    if (confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      deleteSessionMutation.mutate(sessionId)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-full flex flex-col gap-8" style={{ padding: '0.2rem 0.8rem' }}>
        <div className={`p-6 border-b ${colors.border}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-lg font-semibold ${colors.text} flex items-center gap-2`}>
              <MessageSquare className="h-5 w-5" />
              Previous Chats
            </h2>
          </div>
        </div>
        <div className="p-4">
          <div className="text-center py-8">
            <p className={`${colors.textSecondary} text-sm`}>Loading sessions...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="h-full flex flex-col gap-8" style={{ padding: '0.2rem 0.8rem' }}>
        <div className={`p-6 border-b ${colors.border}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-lg font-semibold ${colors.text} flex items-center gap-2`}>
              <MessageSquare className="h-5 w-5" />
              Previous Chats
            </h2>
          </div>
        </div>
        <div className="p-4">
          <div className="text-center py-8">
            <h3 className={`text-lg font-medium ${colors.text} mb-2`}>Error loading sessions</h3>
            <p className={`${colors.textSecondary} text-sm mb-4`}>
              Please try refreshing the page
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show empty state
  if (sessions.length === 0) {
    return (
      <div className="h-full flex flex-col gap-8" style={{ padding: '0.2rem 0.8rem' }}>
        <div className={`p-6 border-b ${colors.border}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-lg font-semibold ${colors.text} flex items-center gap-2`}>
              <MessageSquare className="h-5 w-5" />
              Previous Chats
            </h2>
            <div className="flex items-center gap-2">
              {/* New Chat Button - Only for authenticated users */}
              {isAuthenticated && onNewStory && (
                <button
                  onClick={async () => {
                    setIsCreatingNewChat(true)
                    try {
                      await onNewStory()
                    } finally {
                      // Keep loading state for a bit to show feedback
                      setTimeout(() => setIsCreatingNewChat(false), 500)
                    }
                  }}
                  disabled={isCreatingNewChat}
                  className="p-2 rounded-lg bg-linear-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  title="Start New Chat"
                >
                  {isCreatingNewChat ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors sm:hidden"
                  title="Back to Chat"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="text-center py-8 flex flex-col gap-4 items-center justify-center mt-8">
            {isAuthenticated ? (
              <>
                <h3 className={`text-lg font-medium ${colors.text} mb-2`}>No sessions yet</h3>
                <p className={`${colors.textSecondary} text-sm mb-4`}>
                  Click the + button above to start your first chat session.
                </p>
              </>
            ) : (
              <>
                <h3 className={`text-lg font-medium ${colors.text} mb-2`}>Welcome to Chat</h3>
                <p className={`${colors.textSecondary} text-sm mb-8`}>
                  Sign up to save your conversations and access your chat history
                </p>
                
                {/* Beautiful Auth buttons in single line */}
                <div className="flex gap-3 w-full mt-8 px-4 justify-center items-center">
                  <button
                    onClick={() => router.push('/auth/login')}
                    style={{
                      background: 'linear-gradient(to right, #ef4444, #dc2626)',
                      color: 'white',
                      fontWeight: '600',
                      padding: '8px 16px',
                      borderRadius: '9999px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontSize: '13px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #dc2626, #b91c1c)'
                      e.currentTarget.style.transform = 'scale(1.05)'
                      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #ef4444, #dc2626)'
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <LogIn style={{ width: '16px', height: '16px' }} />
                    <span>Sign In</span>
                  </button>
                  
                  {/* Beautiful Divider */}
                  <div className="flex items-center justify-center px-1">
                    <div className="w-0.5 h-10 bg-linear-to-b from-transparent via-white/50 to-transparent rounded-full"></div>
                  </div>
                  
                  <button
                    onClick={() => router.push('/auth/signup')}
                    style={{
                      background: 'linear-gradient(to right, #10b981, #059669)',
                      color: 'white',
                      fontWeight: '600',
                      padding: '8px 16px',
                      borderRadius: '9999px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontSize: '13px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #059669, #047857)'
                      e.currentTarget.style.transform = 'scale(1.05)'
                      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #10b981, #059669)'
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <UserPlus style={{ width: '16px', height: '16px' }} />
                    <span>Sign Up</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-8" style={{ padding: '0.2rem 0.8rem' }}>
      {/* Header */}
      <div className={`p-6 border-b ${colors.border}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-lg font-semibold ${colors.text} flex items-center gap-2`}>
            <MessageSquare className="h-5 w-5" />
            Previous Chats
          </h2>
          <div className="flex items-center gap-2">
            {/* New Chat Button - Only for authenticated users */}
            {isAuthenticated && onNewStory && (
              <button
                onClick={async () => {
                  setIsCreatingNewChat(true)
                  try {
                    await onNewStory()
                  } finally {
                    // Keep loading state for a bit to show feedback
                    setTimeout(() => setIsCreatingNewChat(false), 500)
                  }
                }}
                disabled={isCreatingNewChat}
                className="p-2 rounded-lg bg-linear-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                title="Start New Chat"
              >
                {isCreatingNewChat ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </button>
            )}
            {/* Back Button for mobile/tablet */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors sm:hidden"
                title="Back to Chat"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className=" overflow-y-auto! space-y-3!">
        {sessions.map((session) => (
          <div
            key={session.session_id}
            className={`group! cursor-pointer! transition-all! duration-200! ease-out! border! border-solid! box-border! rounded-lg! py-3! px-4! mb-2! ${
              currentSessionId === session.session_id
                ? 'bg-purple-100! dark:bg-purple-900/20! border-pink-500! dark:border-pink-500! shadow-sm!'
                : 'bg-gray-100! dark:bg-gray-800/50! border-gray-300/50! dark:border-gray-600/50! hover:border-pink-400! dark:hover:border-pink-500! hover:bg-purple-50! dark:hover:bg-purple-900/10!'
            }`}
            onClick={() => onSessionSelect(session.session_id)}
          >
            <div className="flex! items-center! justify-between! gap-2! ">
              <div className="flex-1 min-w-0">
                <h3 className={`!font-semibold ${colors.text} !truncate !text-sm`} style={{ fontSize: '14px', fontWeight: 600 }}>
                  {session.first_message 
                    ? (session.first_message.length > 60 
                        ? `${session.first_message.substring(0, 60)}...` 
                        : session.first_message)
                    : 'New Chat'}
                </h3>
                <div className={`!flex !items-center !gap-2 !text-xs ${colors.textTertiary} !mt-1`} style={{ fontSize: '11px' }}>
                  <span>{new Date(session.last_message_at || session.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              {/* Delete Session Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteSession(session.session_id)
                }}
                disabled={deleteSessionMutation.isPending}
                className={`
                  ${colors.textMuted} 
                  text-black! hover:bg-linear-to-r! hover:from-red-500! hover:to-red-600!
                  dark:hover:from-red-600! dark:hover:to-red-700!
                  p-2! rounded-lg! 
                  opacity-0! group-hover:opacity-100! 
                  transition-all! duration-300! ease-out!
                  hover:scale-110! hover:shadow-lg! hover:shadow-red-500/25!
                  active:scale-95! active:shadow-inner!
                  border! border-transparent! hover:border-red-300! dark:hover:border-red-600!
                  hover:animate-pulse! hover:cursor-pointer!
                  disabled:opacity-50! disabled:cursor-not-allowed! disabled:transform-none!
                `}
                style={{
                  padding: '0.5rem',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title="Delete Session"
              >
                <div className="relative z-10">
                  <Trash2 className="h-3 w-3" />
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
