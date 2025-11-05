'use client'

import { useEffect } from 'react'
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
  project_id: string
  title: string
  created_at: string
  updated_at: string
  last_message_at: string
  is_active: boolean
  first_message?: string
  message_count?: number
}


interface SessionsSidebarProps {
  onSessionSelect: (sessionId: string, projectId?: string) => void
  currentSessionId?: string
  onClose?: () => void
  onNewStory?: () => void
}

export function SessionsSidebar({ onSessionSelect, currentSessionId, onClose, onNewStory }: SessionsSidebarProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const colors = getThemeColors(resolvedTheme)
  const { isAuthenticated, user } = useAuth()
  const toast = useToastContext()

  // Listen for session updates to refresh the sessions list
  useEffect(() => {
    const handleSessionUpdate = () => {
      console.log('🔄 Session updated, refreshing sessions list')
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    }

    window.addEventListener('sessionUpdated', handleSessionUpdate)
    return () => window.removeEventListener('sessionUpdated', handleSessionUpdate)
  }, [queryClient])

      // Fetch user sessions - simplified for single-user personal assistant
      const { data: sessions = [], isLoading, error } = useQuery({
        queryKey: ['sessions'],
        queryFn: async () => {
          try {
            // For single-user personal assistant, always fetch sessions
            // Backend uses fixed user ID automatically
            const result = await sessionApi.getSessions(20)
            console.log('📋 Raw sessions result:', result)
            
            // Show info toast if no sessions found
            const sessions = (result as { sessions?: Session[] })?.sessions || []
            console.log('📋 Sessions array:', sessions)
            if (sessions.length === 0) {
              toast.info(
                'No Chat History',
                'You don\'t have any previous chat sessions yet.',
                3000
              )
            }
            
            // Fetch first message and message count for each session (optimized)
            const sessionsWithFirstMessage = await Promise.all(
              sessions.map(async (session: Session) => {
                try {
                  // Get messages with a single call - fetch 10 messages to get both first message and count
                  const messagesResponse = await sessionApi.getSessionMessages(session.session_id, 10, 0)
                  console.log(`📋 Session ${session.session_id} raw messages response:`, messagesResponse)
                  
                  // Handle backend response structure: { success: true, messages: [...] }
                  const messages = (messagesResponse as { messages?: unknown[] })?.messages || []
                  const firstMessage = messages.length > 0 ? (messages[0] as { content?: string }).content : undefined
                  
                  console.log(`📋 Session ${session.session_id} processed messages:`, messages.length, 'First message:', firstMessage)
                  
                  return {
                    ...session,
                    first_message: firstMessage,
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
            
            console.log('📋 Final sessions with first message:', sessionsWithFirstMessage)
            
            // Filter out empty sessions (sessions with 0 messages)
            const nonEmptySessions = sessionsWithFirstMessage.filter(session => 
              session.message_count && session.message_count > 0
            )
            
            console.log('📋 Non-empty sessions:', nonEmptySessions.length, 'out of', sessionsWithFirstMessage.length)
            return nonEmptySessions
          } catch (error) {
            console.error('❌ Error fetching sessions:', error)
            toast.error(
              'Load Failed',
              'Failed to load your chat sessions. Please try again.',
              4000
            )
            return []
          }
        },
        refetchInterval: false, // No automatic refresh
        refetchOnWindowFocus: true, // Refetch on window focus to get latest sessions
        refetchOnMount: true, // Fetch on component mount
        staleTime: 30 * 1000, // Consider data fresh for 30 seconds
        enabled: isAuthenticated, // Only fetch when authenticated
        retry: 2, // Retry twice on error
      })

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => sessionApi.deleteSession(sessionId),
    onMutate: async (sessionId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['sessions'] })
      
      // Snapshot the previous value
      const previousSessions = queryClient.getQueryData(['sessions'])
      
      // Optimistically update to remove the session
      queryClient.setQueryData(['sessions'], (old: unknown) => {
        if (!old) return old
        return (old as Session[]).filter((session: Session) => session.session_id !== sessionId)
      })
      
      // Return a context object with the snapshotted value
      return { previousSessions }
    },
    onSuccess: () => {
      // Invalidate and immediately refetch sessions to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.refetchQueries({ queryKey: ['sessions'] })
    },
    onError: (error, sessionId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSessions) {
        queryClient.setQueryData(['sessions'], context.previousSessions)
      }
      console.error('Delete session mutation error:', error)
      toast.error(
        'Delete Failed',
        'An unexpected error occurred while deleting the session.',
        5000
      )
    }
  })

  // Delete all sessions mutation
  const deleteAllSessionsMutation = useMutation({
    mutationFn: async () => {
      const result = await sessionApi.deleteAllSessions()
      return result as { deleted_count?: number }
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['sessions'] })
      
      // Snapshot the previous value
      const previousSessions = queryClient.getQueryData(['sessions'])
      
      // Optimistically update to clear all sessions
      queryClient.setQueryData(['sessions'], [])
      
      // Return a context object with the snapshotted value
      return { previousSessions }
    },
    onSuccess: (result: { deleted_count?: number }) => {
      // Invalidate and immediately refetch sessions to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.refetchQueries({ queryKey: ['sessions'] })
      toast.success(
        'All Sessions Deleted',
        `Successfully deleted ${result.deleted_count || 0} chat sessions.`,
        4000
      )
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSessions) {
        queryClient.setQueryData(['sessions'], context.previousSessions)
      }
      console.error('Delete all sessions mutation error:', error)
      toast.error(
        'Delete Failed',
        'An unexpected error occurred while deleting all sessions.',
        5000
      )
    }
  })

  const handleDeleteSession = async (sessionId: string) => {
    toast.confirm(
      'Attention!',
      'You are about to PERMANENTLY DELETE this chat session!\n\nThis action CANNOT be undone!\nAll messages and story progress will be lost forever!\n\nAre you absolutely sure you want to proceed?',
      async () => {
        try {
          await deleteSessionMutation.mutateAsync(sessionId)
          
          toast.success(
            'Session Deleted',
            'The chat session has been permanently deleted.',
            4000
          )
          
          if (currentSessionId === sessionId) {
            onSessionSelect('')
          }
        } catch (error) {
          console.error('Error deleting session:', error)
          
          toast.error(
            'Delete Failed',
            'Failed to delete the session. Please try again.',
            5000
          )
        }
      },
      () => {
        // Cancel action - no need to do anything
        console.log('Session deletion cancelled')
      },
      'Delete Forever',
      'Cancel'
    )
  }

  const handleDeleteAllSessions = async () => {
    const sessionCount = sessions.length
    if (sessionCount === 0) {
      toast.info(
        'No Sessions',
        'There are no chat sessions to delete.',
        3000
      )
      return
    }

    toast.confirm(
      'DANGER ZONE!',
      `You are about to PERMANENTLY DELETE ALL ${sessionCount} chat sessions!\n\nThis action CANNOT be undone!\nAll messages, story progress, and conversations will be lost forever!\n\nThis is a destructive action that will clear your entire chat history!\n\nAre you absolutely certain you want to proceed?`,
      async () => {
        try {
          await deleteAllSessionsMutation.mutateAsync()
          
          // Clear current session if it exists
          if (currentSessionId) {
            onSessionSelect('')
          }
        } catch (error) {
          console.error('Error deleting all sessions:', error)
        }
      },
      () => {
        // Cancel action - no need to do anything
        console.log('Delete all sessions cancelled')
      },
      'Delete All',
      'Cancel'
    )
  }

  // const handleCreateNewSession = () => {
  //   onSessionSelect('') // Clear current session to create new one
  // }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

      if (isLoading) {
        return (
          <div className="h-full flex flex-col px-4 py-3 sm:px-5 sm:py-4">
            <div className={`pb-4 border-b ${colors.border} mb-4`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-sm font-medium ${colors.text} flex items-center gap-2 uppercase tracking-wider`}>
                  <MessageSquare className="h-4 w-4" />
                  Previous Chats
                </h2>
              </div>
              <p className={`text-sm ${colors.textSecondary}`}>Loading chats...</p>
            </div>
            <div>
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`h-16 ${colors.backgroundTertiary} rounded-lg`}></div>
                ))}
              </div>
            </div>
          </div>
        )
      }

      if (error) {
        return (
          <div className="h-full flex flex-col px-4 py-3 sm:px-5 sm:py-4">
            <div className={`pb-4 border-b ${colors.border} mb-4`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-sm font-medium ${colors.text} flex items-center gap-2 uppercase tracking-wider`}>
                  <MessageSquare className="h-4 w-4" />
                  Previous Chats
                </h2>
              </div>
            </div>
            <div>
              <div className="text-center py-8">
                <h3 className={`text-lg font-medium ${colors.text} mb-2`}>No previous chats found</h3>
                <p className={`${colors.textSecondary} text-sm mb-4`}>
                  Continue to build your story development history
                </p>
              </div>
            </div>
          </div>
        )
      }

          return (
            <div className="h-full flex flex-col px-4 py-3 sm:px-5 sm:py-4">
      {/* Header */}
      <div className={`pb-4 border-b ${colors.border} mb-4`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-sm font-medium ${colors.text} flex items-center gap-2 uppercase tracking-wider`}>
            <MessageSquare className="h-4 w-4" />
            Previous Chats
          </h2>
          <div className="flex items-center gap-2">
            {/* New Story/Chat Button */}
            <button
              onClick={onNewStory}
              className={`p-2 rounded-lg ${colors.buttonPrimary} transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 hover:cursor-pointer`}
              title={isAuthenticated ? "Create New Chat" : "Create New Chat"}
            >
              <Plus className="h-4 w-4" />
            </button>
            {/* Delete All Sessions Button */}
            {isAuthenticated && sessions.length > 0 && (
              <button
                onClick={handleDeleteAllSessions}
                disabled={deleteAllSessionsMutation.isPending}
                className="p-2 rounded-lg bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                title="Delete All Chats"
              >
                <Trash2 className="h-4 w-4" />
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
      <div className="flex-1 overflow-y-auto space-y-2">
        {(sessions as Session[]).length === 0 ? (
          <div className="text-center py-8 flex flex-col gap-4 items-center justify-center mt-8">
            {isAuthenticated ? (
              <>
                <h3 className={`text-lg font-medium ${colors.text} mb-2`}>No previous chats</h3>
                <p className={`${colors.textSecondary} text-sm mb-4`}>
                  Start a new conversation to begin your story development journey
                </p>
              </>
            ) : (
              <>
                <h3 className={`text-lg font-medium ${colors.text} mb-2`}>Welcome</h3>
                <p className={`${colors.textSecondary} text-sm mb-8`}>
                  Sign in to save your conversations and access your chat history
                </p>
                
                {/* Beautiful Auth buttons in single line */}
                <div className="flex gap-3 w-full mt-8 px-4 justify-center items-center">
                  <button
                    onClick={() => router.push('/auth/login')}
                    className={`px-4 py-2 rounded-full ${colors.buttonPrimary} flex items-center gap-2 text-sm`}
                  >
                    <LogIn style={{ width: '16px', height: '16px' }} />
                    <span>Sign In</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          (sessions as Session[]).map((session: Session) => (
            <div
              key={session.session_id}
              className={`group cursor-pointer transition-all duration-200 rounded-lg border ${
                currentSessionId === session.session_id
                  ? `${colors.sidebarItemActive} ${colors.border}`
                  : `${colors.sidebarItem} ${colors.border}`
              }`}
              style={{ 
                padding: '0.75rem 1rem',
                margin: '0.2rem 0'
              }}
              onClick={() => {
                console.log('📋 Previous chat clicked:', session.session_id, 'Project:', session.project_id)
                toast.info('Loading Session', 'Switching to selected chat session...', 2000)
                onSessionSelect(session.session_id, session.project_id)
              }}
            >
              <div className="flex items-start justify-between" style={{ alignItems: 'center' }}>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium ${colors.text} truncate mb-1 text-sm`}>
                    {session.title && session.title !== 'New Chat' ? session.title : 
                     session.first_message ? session.first_message.substring(0, 50) + (session.first_message.length > 50 ? '...' : '') : 
                     'New Chat'}
                  </h3>
                  
                  <div className={`flex items-center gap-2 text-xs ${colors.textTertiary}`}>
                    <span>{formatDate(session.last_message_at)}</span>
                    {session.message_count && session.message_count > 0 && (
                      <>
                        <span>•</span>
                        <span>{session.message_count} msg{session.message_count !== 1 ? 's' : ''}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteSession(session.session_id)
                  }}
                  className={`
                    relative overflow-hidden
                    ${colors.textMuted} 
                    text-black hover:bg-linear-to-r hover:from-red-500 hover:to-red-600
                    dark:hover:from-red-600 dark:hover:to-red-700
                    p-2 rounded-lg 
                    opacity-0 group-hover:opacity-100 
                    transition-all duration-300 ease-out
                    hover:scale-110 hover:shadow-lg hover:shadow-red-500/25
                    active:scale-95 active:shadow-inner
                    border border-transparent hover:border-red-300 dark:hover:border-red-600
                    hover:animate-pulse hover:cursor-pointer mr-8
                  `}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                  }}
                  title="⚠️ Delete session permanently"
                >
                  <div className="relative z-10">
                    <Trash2 className="h-3 w-3" />
                  </div>
                  {/* Animated background effect */}
                  <div className="absolute inset-0 bg-linear-to-r from-red-400 to-red-600 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                  {/* Danger sparkle effect */}
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full opacity-0 hover:opacity-100 animate-ping"></div>
                  <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-red-400 rounded-full opacity-0 hover:opacity-100 animate-ping" style={{ animationDelay: '0.5s' }}></div>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
