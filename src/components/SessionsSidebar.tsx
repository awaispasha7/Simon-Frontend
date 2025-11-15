'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { sessionApi, projectApi } from '@/lib/api'
import { useTheme, getThemeColors } from '@/lib/theme-context'
import { useAuth } from '@/lib/auth-context'
import { useToastContext } from '@/components/ToastProvider'
import { ProjectCreationModal } from '@/components/ProjectCreationModal'
import { MessageSquare, Trash2, LogIn, UserPlus, ChevronLeft, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import Image from 'next/image'

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
  currentProjectId?: string
  onClose?: () => void
  onNewStory?: (projectId?: string) => void
  onNewProject?: () => void
  onProjectCreated?: (projectId: string, projectName: string) => void | Promise<void>
}

interface ProjectWithSessions {
  project_id: string
  name: string
  description?: string
  user_id: string
  created_at: string
  updated_at: string
  session_count: number
  sessions?: Array<{
    session_id: string
    title: string
    created_at: string
    last_message_at: string
    is_active: boolean
    first_message?: string
    message_count?: number
  }>
}

export function SessionsSidebar({ 
  onSessionSelect, 
  currentSessionId, 
  currentProjectId,
  onClose, 
  onNewStory,
  onNewProject,
  onProjectCreated
}: SessionsSidebarProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const colors = getThemeColors(resolvedTheme)
  const { isAuthenticated, user } = useAuth()
  const toast = useToastContext()
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [showProjectModal, setShowProjectModal] = useState(false)

  // Expand project when it contains the current session
  useEffect(() => {
    if (currentProjectId && currentSessionId) {
      setExpandedProjects(prev => new Set(prev).add(currentProjectId))
    }
  }, [currentProjectId, currentSessionId])

  // Listen for session updates to refresh the projects list
  useEffect(() => {
    const handleSessionUpdate = () => {
      console.log('🔄 Session updated, refreshing projects list')
      // Single, lightweight invalidation; React Query will refetch once
      queryClient.invalidateQueries({ queryKey: ['projectsSidebar'] })
    }
    let lastDossierEventAt = 0
    const handleDossierUpdated = () => {
      const now = Date.now()
      if (now - lastDossierEventAt < 1200) {
        return
      }
      lastDossierEventAt = now
      console.log('🔄 Dossier updated, refreshing projects list')
      queryClient.invalidateQueries({ queryKey: ['projectsSidebar'] })
    }

    window.addEventListener('sessionUpdated', handleSessionUpdate)
    window.addEventListener('dossierUpdated', handleDossierUpdated)
    return () => {
      window.removeEventListener('sessionUpdated', handleSessionUpdate)
      window.removeEventListener('dossierUpdated', handleDossierUpdated)
    }
  }, [queryClient])

  // Toggle project expansion
  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev)
      if (newSet.has(projectId)) {
        newSet.delete(projectId)
      } else {
        newSet.add(projectId)
      }
      return newSet
    })
  }

  // Fetch projects with sessions for authenticated users
  const { data: projectsData, isLoading, error } = useQuery({
    // Use a distinct key to avoid cache shape conflicts with page-level projects query
    queryKey: ['projectsSidebar'],
    queryFn: async () => {
      try {
        if (!user?.user_id) {
          await new Promise(resolve => setTimeout(resolve, 100))
          if (!user?.user_id) {
            throw new Error('User not loaded yet')
          }
        }
        
        const result = await projectApi.getProjects()
        console.log('📋 Projects result:', result)
        
        // Limit to first 50 projects to prevent excessive API calls
        // Users can still see all projects but details are loaded lazily on expand
        const projectsToFetch = result.projects.slice(0, 50)
        const remainingProjects = result.projects.slice(50).map(project => ({
          ...project,
          sessions: [],
          session_count: project.session_count || 0
        }))
        
        // Fetch detailed project info with sessions for each project (limited batch)
        const projectsWithSessions: ProjectWithSessions[] = await Promise.all(
          projectsToFetch.map(async (project) => {
            try {
              const projectDetail = await projectApi.getProject(project.project_id)
              
              // Enhance sessions with first message and count
              const sessionsWithDetails = await Promise.all(
                (projectDetail.sessions || []).map(async (session) => {
                  try {
                    const messagesResponse = await sessionApi.getSessionMessages(session.session_id, 10, 0)
                    const messages = (messagesResponse as { messages?: unknown[] })?.messages || []
                    const firstMessage = messages.length > 0 ? (messages[0] as { content?: string }).content : undefined
                    
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
              
              // Filter out empty sessions
              const nonEmptySessions = sessionsWithDetails.filter(s => s.message_count && s.message_count > 0)
              
              return {
                ...project,
                sessions: nonEmptySessions
              }
            } catch (error) {
              console.warn(`Failed to fetch project details for ${project.project_id}:`, error)
              return {
                ...project,
                sessions: []
              }
            }
          })
        )
        
        // Combine fetched projects with remaining projects (without session details)
        const allProjects = [...projectsWithSessions, ...remainingProjects]
        
        return allProjects
      } catch (error) {
        console.error('❌ Error fetching projects:', error)
        toast.error(
          'Load Failed',
          'Failed to load your projects. Please try again.',
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

  // Ensure projects is always an array
  const projects: ProjectWithSessions[] = Array.isArray(projectsData) 
    ? projectsData 
    : (projectsData && typeof projectsData === 'object' && 'projects' in projectsData)
      ? (projectsData as { projects: ProjectWithSessions[] }).projects
      : []

  // Handle project creation
  const handleProjectCreated = async (projectId: string, projectName: string) => {
    console.log('✅ [SIDEBAR] Project created:', projectId, projectName)
    
    // If parent provides handler, use it (it handles session creation and state)
    if (onProjectCreated) {
      console.log('📞 [SIDEBAR] Delegating to parent onProjectCreated handler')
      try {
        await onProjectCreated(projectId, projectName)
      } catch (error) {
        console.error('❌ [SIDEBAR] Error in parent onProjectCreated:', error)
      }
    } else {
      // Fallback: just invalidate queries and show toast
      queryClient.invalidateQueries({ queryKey: ['projectsSidebar'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.refetchQueries({ queryKey: ['projectsSidebar'] })
      toast.success(
        'Project Created',
        `"${projectName}" has been created successfully!`,
        3000
      )
      if (onNewProject) {
        onNewProject()
      }
    }
    
    setShowProjectModal(false)
  }

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => sessionApi.deleteSession(sessionId),
    onMutate: async (sessionId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['projectsSidebar'] })
      
      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData(['projectsSidebar'])
      
      // Optimistically update to remove the session from projects
      queryClient.setQueryData(['projectsSidebar'], (old: unknown) => {
        if (!old) return old
        const oldArr = old as ProjectWithSessions[]
        return oldArr.map(project => ({
          ...project,
          sessions: (project.sessions || []).filter(s => s.session_id !== sessionId),
          session_count: (project.sessions || []).filter(s => s.session_id !== sessionId).length
        }))
      })
      
      return { previousProjects }
    },
    onSuccess: () => {
      // Invalidate and immediately refetch projects to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['projectsSidebar'] })
      queryClient.refetchQueries({ queryKey: ['projectsSidebar'] })
      // Keep page-level projects in sync too
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: (error, sessionId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProjects) {
        queryClient.setQueryData(['projectsSidebar'], context.previousProjects)
      }
      console.error('Delete session mutation error:', error)
      toast.error(
        'Delete Failed',
        'An unexpected error occurred while deleting the session.',
        5000
      )
    }
  })

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: string) => projectApi.deleteProject(projectId),
    onMutate: async (projectId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['projectsSidebar'] })
      
      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData(['projectsSidebar'])
      
      // Optimistically update to remove the project
      queryClient.setQueryData(['projectsSidebar'], (old: unknown) => {
        if (!old) return old
        const oldArr = old as ProjectWithSessions[]
        return oldArr.filter(p => p.project_id !== projectId)
      })
      
      return { previousProjects }
    },
    onSuccess: async (result, projectId) => {
      // Invalidate and immediately refetch projects to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['projectsSidebar'] })
      await queryClient.refetchQueries({ queryKey: ['projectsSidebar'] })
      // Keep page-level projects in sync too
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      
      // Get the updated projects from the cache
      const cachedProjects = queryClient.getQueryData(['projects']) as ProjectWithSessions[] | undefined
      const updatedProjects = cachedProjects || []
      
      toast.success(
        'Project Deleted',
        'Project and all its sessions have been deleted successfully.',
        4000
      )
      
      // If deleted project was the current one, clear selection and localStorage
      if (currentProjectId === projectId) {
        // Clear selection
        onSessionSelect('', '')
        
        // Clear localStorage
        try {
          localStorage.removeItem('chat_session')
        } catch (error) {
          console.error('Failed to clear localStorage:', error)
        }
        
        // If no projects remain, the chat page will handle showing the project modal
        if (updatedProjects.length === 0) {
          console.log('📭 [SIDEBAR] No projects remaining - page should show project creation modal')
        }
      }
    },
    onError: (error, projectId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects)
      }
      console.error('Delete project mutation error:', error)
      toast.error(
        'Delete Failed',
        'Failed to delete project. Please try again.',
        5000
      )
    }
  })

  // Delete all projects mutation
  const deleteAllProjectsMutation = useMutation({
    mutationFn: async () => {
      // Delete all projects one by one
      const deletePromises = projects.map(project => projectApi.deleteProject(project.project_id))
      await Promise.all(deletePromises)
      return { deleted_count: projects.length }
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['projects'] })
      
      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData(['projects'])
      
      // Optimistically update to clear all projects
      queryClient.setQueryData(['projects'], [])
      
      return { previousProjects }
    },
    onSuccess: (result: { deleted_count: number }) => {
      // Invalidate and immediately refetch projects to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.refetchQueries({ queryKey: ['projects'] })
      toast.success(
        'All Projects Deleted',
        `Successfully deleted ${typeof result.deleted_count === 'number' ? result.deleted_count : projects.length} projects and all their sessions.`,
        4000
      )
      
      // Clear current selection
      onSessionSelect('', '')
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects)
      }
      console.error('Delete all projects mutation error:', error)
      toast.error(
        'Delete Failed',
        'Failed to delete all projects. Some projects may have been deleted.',
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
            onSessionSelect('', '')
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

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    toast.confirm(
      '⚠️ DANGER ZONE ⚠️',
      `You are about to PERMANENTLY DELETE the project "${projectName}"!\n\nThis action CANNOT be undone!\nAll chat sessions and story progress in this project will be lost forever!\n\nAre you absolutely sure you want to proceed?`,
      async () => {
        try {
          await deleteProjectMutation.mutateAsync(projectId)
        } catch (error) {
          console.error('Error deleting project:', error)
          // Error toast is already shown in mutation's onError
        }
      },
      () => {
        // Cancel action - no need to do anything
        console.log('Project deletion cancelled')
      },
      'Delete Forever',
      'Cancel'
    )
  }

  const handleDeleteAllProjects = async () => {
    if (projects.length === 0) {
      toast.info(
        'No Projects',
        'There are no projects to delete.',
        3000
      )
      return
    }

    const projectCount = projects.length
    const sessionCount = projects.reduce((sum, p) => sum + (p.sessions?.length ?? 0), 0)

    toast.confirm(
      '⚠️ EXTREME DANGER ZONE ⚠️',
      `You are about to PERMANENTLY DELETE ALL ${projectCount} PROJECTS!\n\nThis will also delete ALL ${sessionCount} CHAT SESSIONS!\n\nThis action CANNOT be undone!\nAll messages and story progress will be lost forever!\n\nAre you absolutely sure you want to proceed?`,
      async () => {
        try {
          const result = await deleteAllProjectsMutation.mutateAsync()
          
          toast.success(
            'All Projects Deleted',
            `Successfully deleted ${typeof result.deleted_count === 'number' ? result.deleted_count : projects.length} projects and all their sessions.`,
            4000
          )
        } catch (error) {
          console.error('Error deleting all projects:', error)
          // Error toast is already shown in mutation's onError
        }
      },
      () => {
        // Cancel action - no need to do anything
        console.log('Delete all projects cancelled')
      },
      'Delete All Forever',
      'Cancel'
    )
  }


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
          <div className="h-full flex flex-col">
            <div className={`p-4 border-b ${colors.border}`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-lg font-semibold ${colors.text} flex items-center gap-2`}>
                  <MessageSquare className="h-5 w-5" />
                  Previous Chats
                </h2>
              </div>
              <p className={`text-sm ${colors.textSecondary}`}>Loading chats...</p>
            </div>
            <div className="p-4">
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
          <div className="h-full flex flex-col">
            <div className={`p-4 border-b ${colors.border}`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-lg font-semibold ${colors.text} flex items-center gap-2`}>
                  <MessageSquare className="h-5 w-5" />
                  Previous Chats
                </h2>
              </div>
            </div>
            <div className="p-4">
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
    <div className="h-full flex flex-col gap-8" style={{ padding: '0.2rem 0.8rem' }}>
      {/* Header */}
      <div className={`p-6 border-b ${colors.border}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-lg font-semibold ${colors.text} flex items-center gap-2`}>
            <MessageSquare className="h-5 w-5" />
            Previous Chats
          </h2>
          <div className="flex items-center gap-2">
            {/* New Project Button - Only for authenticated users */}
            {isAuthenticated && (
              <button
                onClick={() => setShowProjectModal(true)}
                className="p-2 rounded-lg bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 hover:cursor-pointer"
                title="Create New Project"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
            {/* Delete All Projects Button */}
            {isAuthenticated && projects.length > 0 && (
              <button
                onClick={handleDeleteAllProjects}
                disabled={deleteAllProjectsMutation.isPending}
                className="p-2 rounded-lg bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                title="Delete All Projects"
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

      {/* Projects List - Hierarchical Structure */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {projects.length === 0 ? (
          <div className="text-center py-8 flex flex-col gap-4 items-center justify-center mt-8">
            {isAuthenticated ? (
              <>
                <h3 className={`text-lg font-medium ${colors.text} mb-2`}>No projects yet</h3>
                <p className={`${colors.textSecondary} text-sm mb-4`}>
                  Create a project to get started with your story.
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
                      background: 'linear-gradient(to right, #3b82f6, #2563eb)',
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
                      e.currentTarget.style.background = 'linear-gradient(to right, #2563eb, #1d4ed8)'
                      e.currentTarget.style.transform = 'scale(1.05)'
                      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #3b82f6, #2563eb)'
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
        ) : (
          projects.map((project: ProjectWithSessions) => {
            const isExpanded = expandedProjects.has(project.project_id)
            const hasActiveSessions = (project.sessions?.length ?? 0) > 0
            
            return (
              <div key={project.project_id} style={{ marginBottom: '1rem' }}>
                {/* Project Header */}
                <div
                  className={`group cursor-pointer transition-all duration-200 border-b-2 ${
                    currentProjectId === project.project_id
                      ? 'ring-2 ring-pink-500 bg-blue-50 dark:bg-blue-900/20 border-b-blue-300 dark:border-b-blue-600'
                      : `${colors.sidebarItem} border-b-gray-300 dark:border-b-gray-600`
                  }`}
                  style={{ 
                    padding: '0.875rem 1rem',
                    margin: '0.5rem',
                    borderRadius: '0.5rem'
                  }}
                  onClick={() => toggleProject(project.project_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Expand/Collapse Icon */}
                      {hasActiveSessions ? (
                        isExpanded ? (
                          <ChevronDown className="h-4 w-4 shrink-0" style={{ color: resolvedTheme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0" style={{ color: resolvedTheme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                        )
                      ) : null}
                      
                      {/* Project Icon - idea.svg */}
                      <div style={{ width: '20px', height: '20px', flexShrink: 0 }}>
                        <Image 
                          src="/idea.svg" 
                          alt="Project" 
                          width={20} 
                          height={20}
                          style={{ filter: resolvedTheme === 'dark' ? 'invert(1)' : 'none' }}
                        />
                      </div>
                      
                      {/* Project Name */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold ${colors.text} truncate text-sm`} style={{ fontSize: '14px', fontWeight: 600 }}>
                          {project.name && project.name.trim() ? project.name : 'Untitled Project'}
                        </h3>
                        <div className={`flex items-center gap-2 text-xs ${colors.textTertiary} mt-0.5`} style={{ fontSize: '12px', marginTop: '2px' }}>
                          <span>{(project.sessions?.length ?? 0)} session{(project.sessions?.length ?? 0) !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* New Chat Button - Show when expanded */}
                      {isExpanded && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (onNewStory) {
                              onNewStory(project.project_id) // Pass project_id so chat is created in this project
                            }
                          }}
                          className={`
                            ${colors.textMuted} 
                            text-black hover:bg-linear-to-r hover:from-blue-500 hover:to-blue-600
                            dark:hover:from-blue-600 dark:hover:to-blue-700
                            p-2 rounded-lg 
                            opacity-0 group-hover:opacity-100 
                            transition-all duration-300 ease-out
                            hover:scale-110 hover:shadow-lg hover:shadow-blue-500/25
                            active:scale-95 active:shadow-inner
                            border border-transparent hover:border-blue-300 dark:hover:border-blue-600
                            hover:animate-pulse hover:cursor-pointer
                          `}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                          }}
                          title={`Create New Chat in "${project.name}"`}
                        >
                          <div className="relative z-10">
                            <Plus className="h-3 w-3" />
                          </div>
                        </button>
                      )}

                      {/* Rename Project Button (shows on hover) */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          const currentName = project.name && project.name.trim() ? project.name : 'Untitled Project'
                          // Use input toast for better UX
                          toast.input(
                            'Rename Project',
                            'Enter a new name for this project.',
                            currentName,
                            async (value: string) => {
                              const newName = (value || '').trim()
                              if (!newName || newName === currentName) return
                              try {
                                // Optimistic update
                                queryClient.setQueryData(['projectsSidebar'], (old: unknown) => {
                                  if (!old) return old
                                  const arr = old as ProjectWithSessions[]
                                  return arr.map(p => p.project_id === project.project_id ? { ...p, name: newName } : p)
                                })
                                await projectApi.renameProject(project.project_id, newName)
                                queryClient.invalidateQueries({ queryKey: ['projects'] })
                                toast.success('Project Renamed', `Project name updated to "${newName}"`, 3000)
                              } catch (err) {
                                console.error('Rename project failed:', err)
                                toast.error('Rename Failed', 'Could not rename the project. Please try again.', 4000)
                                queryClient.invalidateQueries({ queryKey: ['projectsSidebar'] })
                              }
                            },
                            undefined,
                            'Save',
                            'Cancel',
                            'Project name'
                          )
                        }}
                        className={`
                          ${colors.textMuted} 
                          text-black hover:bg-linear-to-r hover:from-emerald-500 hover:to-emerald-600
                          dark:hover:from-emerald-600 dark:hover:to-emerald-700
                          p-2 rounded-lg 
                          opacity-0 group-hover:opacity-100 
                          transition-all duration-300 ease-out
                          hover:scale-110 hover:shadow-lg hover:shadow-emerald-500/25
                          active:scale-95 active:shadow-inner
                          border border-transparent hover:border-emerald-300 dark:hover:border-emerald-600
                          hover:animate-pulse hover:cursor-pointer
                        `}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}
                        title="Rename Project"
                      >
                        <div className="relative z-10">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
                            <path d="M16.862 4.487a1.5 1.5 0 0 1 2.121 2.121l-9.9 9.9a1.5 1.5 0 0 1-.53.35l-3.25 1.084a.5.5 0 0 1-.633-.633l1.084-3.25a1.5 1.5 0 0 1 .35-.53l9.9-9.9z"/>
                            <path d="M19.5 10.5v7.25A2.25 2.25 0 0 1 17.25 20H6.75A2.25 2.25 0 0 1 4.5 17.75V7.5A2.25 2.25 0 0 1 6.75 5.25h7.25" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                        </div>
                      </button>

                      {/* Delete Project Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteProject(project.project_id, project.name)
                        }}
                        disabled={deleteProjectMutation.isPending}
                        className={`
                          ${colors.textMuted} 
                          text-black hover:bg-linear-to-r hover:from-red-500 hover:to-red-600
                          dark:hover:from-red-600 dark:hover:to-red-700
                          p-2 rounded-lg 
                          opacity-0 group-hover:opacity-100 
                          transition-all duration-300 ease-out
                          hover:scale-110 hover:shadow-lg hover:shadow-red-500/25
                          active:scale-95 active:shadow-inner
                          border border-transparent hover:border-red-300 dark:hover:border-red-600
                          hover:animate-pulse hover:cursor-pointer
                          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                        `}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}
                        title={`Delete Project "${project.name}"`}
                      >
                        <div className="relative z-10">
                          <Trash2 className="h-3 w-3" />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Sessions List - Nested with better spacing */}
                {isExpanded && hasActiveSessions && project.sessions && (
                  <div 
                    style={{ 
                      margin: '1rem 0.5rem 1rem 3rem ',
                      paddingLeft: '1.25rem',
                      borderLeft: `2px solid ${resolvedTheme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    {project.sessions.map((session) => (
                      <div
                        key={session.session_id}
                        className={`group cursor-pointer transition-all duration-200 rounded-lg border-2 ${
                          currentSessionId === session.session_id
                            ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600'
                            : `${colors.sidebarItem} ${colors.border} border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600`
                        }`}
                        style={{ 
                          padding: '0.625rem 1rem',
                          borderRadius: '0.5rem',
                          marginBottom: '0.25rem'
                        }}
                        onMouseEnter={(e) => {
                          if (currentSessionId !== session.session_id) {
                            e.currentTarget.style.backgroundColor = resolvedTheme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'
                            e.currentTarget.style.transform = 'translateX(2px)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (currentSessionId !== session.session_id) {
                            e.currentTarget.style.backgroundColor = ''
                            e.currentTarget.style.transform = 'translateX(0)'
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          console.log('📋 Session clicked:', session.session_id, 'Project:', project.project_id)
                          toast.info('Loading Session', 'Switching to selected chat session...', 2000)
                          onSessionSelect(session.session_id, project.project_id)
                        }}
                      >
                        <div className="flex items-start justify-between" style={{ alignItems: 'center' }}>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium ${colors.text} truncate mb-1 text-sm`} style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                              {session.title && session.title !== 'New Chat' ? session.title : 
                               session.first_message ? session.first_message.substring(0, 50) + (session.first_message.length > 50 ? '...' : '') : 
                               'New Chat'}
                            </h4>
                            
                            <div className={`flex items-center gap-2 text-xs ${colors.textTertiary}`} style={{ fontSize: '11px' }}>
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
                              hover:animate-pulse hover:cursor-pointer
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
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
      
      {/* Project Creation Modal */}
      <ProjectCreationModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onProjectCreated={handleProjectCreated}
        isRequired={false}
      />
    </div>
  )
}
