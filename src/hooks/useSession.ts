import { useState, useEffect, useCallback, useRef } from 'react'
import { sessionApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

// Global session creation guard to prevent multiple simultaneous creations
let globalSessionCreationInProgress = false

// Session persistence key
const SESSION_STORAGE_KEY = 'chat_session'

interface SessionState {
  sessionId: string | null
  projectId: string | null
  isAuthenticated: boolean
  expiresAt: number | null
  isLoading: boolean
}

// Simple session hook that works with props from parent components
export function useSession(sessionId?: string, projectId?: string) {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  
  // Try to restore session from localStorage if no sessionId provided
  const getInitialSession = () => {
    if (sessionId && sessionId.trim()) {
      return {
        sessionId: sessionId,
        projectId: projectId && projectId.trim() ? projectId : null,
        isAuthenticated,
        expiresAt: null,
        isLoading: false
      }
    }
    
          // For anonymous users, try to restore session from localStorage
          if (!isAuthenticated) {
            console.log('🔄 [DEMO] Anonymous user - checking for existing session')
          }
    
    // For authenticated users, try to restore from localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(SESSION_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          // Sessions don't expire in the new system, so just restore if we have a sessionId
          if (parsed.sessionId) {
            // Check if the session belongs to the current user
            const currentUser = localStorage.getItem('user')
            if (currentUser) {
              const userData = JSON.parse(currentUser)
              const currentUserId = userData.user_id
              const sessionUserId = parsed.userId
              
              // If user IDs don't match, clear the invalid session
              if (sessionUserId && sessionUserId !== currentUserId) {
                console.log('🚨 Session belongs to different user, clearing invalid session')
                localStorage.removeItem(SESSION_STORAGE_KEY)
                return {
                  sessionId: '',
                  projectId: '',
                  isAuthenticated: false,
                  expiresAt: null,
                  isLoading: false
                }
              }
            }
            
            return {
              sessionId: parsed.sessionId,
              projectId: parsed.projectId,
              isAuthenticated: parsed.isAuthenticated || false,
              expiresAt: null,
              isLoading: false
            }
          }
        }
      } catch (error) {
        console.error('Error restoring session from localStorage:', error)
        localStorage.removeItem(SESSION_STORAGE_KEY)
      }
    }
    
    return {
      sessionId: null,
      projectId: null,
      isAuthenticated,
      expiresAt: null,
      isLoading: true // Only loading if no sessionId provided and no stored session
    }
  }
  
  const [sessionState, setSessionState] = useState<SessionState>(getInitialSession)
  
  // Prevent multiple session creations
  const sessionCreationInProgress = useRef(false)

  // Update state when props change
  useEffect(() => {
    setSessionState(prev => ({
      ...prev,
      sessionId: sessionId && sessionId.trim() ? sessionId : null,
      projectId: projectId && projectId.trim() ? projectId : null,
      isAuthenticated,
      isLoading: (!sessionId || !sessionId.trim()) && authLoading
    }))
  }, [sessionId, projectId, isAuthenticated, authLoading])

  // Create a new session (only when no sessionId is provided or sessionId is empty)
  const createSession = useCallback(async () => {
    console.log('🔄 [SESSION] createSession called')
    
    // Double-check that we don't have a sessionId prop
    if (sessionId && sessionId.trim()) {
      console.log('🔄 [SESSION] Session ID provided, skipping creation')
      return
    }
    
    // Double-check that we don't already have a session in state
    if (sessionState.sessionId && sessionState.sessionId.trim()) {
      console.log('🔄 [SESSION] Session already exists in state, skipping creation')
      return
    }

    // Prevent multiple concurrent session creations (both local and global)
    if (sessionCreationInProgress.current || globalSessionCreationInProgress) {
      console.log('🔄 [SESSION] Session creation already in progress, skipping...')
      return
    }

    console.log('🔄 [SESSION] Starting session creation')
    sessionCreationInProgress.current = true
    globalSessionCreationInProgress = true
    setSessionState(prev => ({ ...prev, isLoading: true }))

    try {
      // For authenticated users, ensure we have project_id before calling API
      if (isAuthenticated && !projectId) {
        console.log('🔄 [SESSION] Authenticated user needs project_id, skipping session creation')
        setSessionState(prev => ({ ...prev, isLoading: false }))
        // Mark as blocked to prevent retries
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('chat_session_creation_blocked', 'true')
          } catch (e) {
            // Ignore localStorage errors
          }
        }
        return
      }
      
      console.log('🔄 [SESSION] Calling sessionApi.getOrCreateSession()', { sessionId, projectId })
      const response = await sessionApi.getOrCreateSession(sessionId, projectId) as { 
        success?: boolean; 
        session_id?: string; 
        project_id?: string;
        is_authenticated?: boolean;
        user_id?: string;
      }
      
      // Clear any previous block on success
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('chat_session_creation_blocked')
        } catch (e) {
          // Ignore localStorage errors
        }
      }
      
      // The backend returns the session data in a success wrapper
      if (response && response.success && response.session_id) {
        const newSessionState = {
          sessionId: response.session_id,
          projectId: response.project_id || null,
          isAuthenticated: response.is_authenticated || false,
          expiresAt: null, // Sessions don't expire in the new system
          isLoading: false
        }
        setSessionState(newSessionState)
        
        // Persist session to localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
              sessionId: response.session_id,
              projectId: response.project_id,
              userId: response.user_id,
              isAuthenticated: response.is_authenticated
            }))
          } catch (error) {
            console.error('Failed to persist session to localStorage:', error)
          }
        }
      } else {
        console.error('Invalid response from session creation:', response)
        setSessionState(prev => ({ ...prev, isLoading: false }))
      }
    } catch (error: any) {
      console.error('Failed to create session:', error)
      
      // Log full error details for debugging
      try {
        const errorDetail = await error?.response?.json?.() || error?.response?.data || {}
        console.error('📋 [SESSION] Full error response:', {
          statusCode: error?.response?.status || error?.status || 0,
          message: error?.message || '',
          detail: errorDetail?.detail || errorDetail?.message || 'Unknown error'
        })
      } catch (e) {
        // Error response might not be JSON, that's okay
      }
      
      // Get error details
      const errorMessage = error?.message || ''
      const statusCode = error?.response?.status || error?.status || 0
      
      // For 500 errors (server errors), don't retry immediately - mark as blocked temporarily
      // For 400/404 errors (client errors like missing project), don't retry at all
      if (statusCode === 500 || statusCode === 503) {
        console.error('🔄 [SESSION] Server error (500/503) - will not retry automatically')
        setSessionState(prev => ({ ...prev, isLoading: false }))
        // Mark as blocked temporarily (will clear after page reload or manual retry)
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('chat_session_creation_blocked', 'true')
            localStorage.setItem('chat_session_error', JSON.stringify({
              message: errorMessage,
              statusCode,
              timestamp: Date.now()
            }))
          } catch (e) {
            // Ignore localStorage errors
          }
        }
      } else if (errorMessage.includes('project') || errorMessage.includes('Project') || 
          statusCode === 400 || statusCode === 404) {
        console.log('🔄 [SESSION] Session creation failed due to missing project. Will not retry.')
        // Mark that we've tried and failed - don't retry for this error
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('chat_session_creation_blocked', 'true')
          } catch (e) {
            // Ignore localStorage errors
          }
        }
      }
      
      setSessionState(prev => ({ ...prev, isLoading: false }))
    } finally {
      sessionCreationInProgress.current = false
      globalSessionCreationInProgress = false
    }
  }, [sessionId, projectId, sessionState.sessionId, isAuthenticated])

  // Listen for session updates from other components
  useEffect(() => {
    const handleSessionUpdate = (event: CustomEvent) => {
      console.log('🔄 [SESSION] Received session update event:', event.detail)
      const { sessionId: newSessionId, projectId: newProjectId } = event.detail || {}
      
      if (newSessionId && newSessionId !== sessionState.sessionId) {
        console.log('🔄 [SESSION] Updating session state from event:', newSessionId)
        setSessionState(prev => ({
          ...prev,
          sessionId: newSessionId,
          projectId: newProjectId || prev.projectId,
          isLoading: false
        }))
        
        // Also verify localStorage has the correct session
        setTimeout(() => {
          try {
            const stored = localStorage.getItem(SESSION_STORAGE_KEY)
            if (stored) {
              const parsed = JSON.parse(stored)
              if (parsed.sessionId !== newSessionId) {
                console.warn('⚠️ [SESSION] localStorage session mismatch after update event')
                // Force localStorage update
                localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
                  sessionId: newSessionId,
                  projectId: newProjectId,
                  isAuthenticated: sessionState.isAuthenticated
                }))
                console.log('🔧 [SESSION] Forced localStorage update to match event')
              }
            }
          } catch (error) {
            console.error('Failed to verify localStorage after session update:', error)
          }
        }, 100)
      }
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SESSION_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (parsed.sessionId && parsed.sessionId !== sessionState.sessionId) {
            console.log('🔄 [SESSION] Session updated in localStorage:', parsed.sessionId)
            setSessionState(prev => ({
              ...prev,
              sessionId: parsed.sessionId,
              projectId: parsed.projectId || prev.projectId,
              isAuthenticated: parsed.isAuthenticated || prev.isAuthenticated,
              isLoading: false
            }))
          }
        } catch (error) {
          console.error('Failed to parse session from storage event:', error)
        }
      }
    }


    // Also check localStorage on mount to catch any missed session updates
    const checkInitialSession = () => {
      try {
        const stored = localStorage.getItem(SESSION_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.sessionId && parsed.sessionId !== sessionState.sessionId) {
            console.log('🔄 [SESSION] Found updated session in localStorage on mount:', parsed.sessionId)
            setSessionState(prev => ({
              ...prev,
              sessionId: parsed.sessionId,
              projectId: parsed.projectId || prev.projectId,
              isAuthenticated: parsed.isAuthenticated || prev.isAuthenticated,
              isLoading: false
            }))
          }
        }
      } catch (error) {
        console.error('Failed to check initial session from localStorage:', error)
      }
    }

    // Check on mount
    checkInitialSession()

    window.addEventListener('sessionUpdated', handleSessionUpdate as EventListener)
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('sessionUpdated', handleSessionUpdate as EventListener)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [sessionState.sessionId, sessionState.isAuthenticated]) // Include dependencies used in the effect

  // Auto-create session if none provided and auth is ready
  useEffect(() => {
    // Don't create session if we have a valid sessionId prop
    if (sessionId && sessionId.trim()) {
      console.log('🔄 [SESSION] useEffect check: Session ID provided, skipping creation check')
      return
    }
    
    // Don't create session if we already have a session in state
    if (sessionState.sessionId && sessionState.sessionId.trim()) {
      console.log('🔄 [SESSION] useEffect check: Session already exists in state, skipping creation check')
      return
    }
    
    // CRITICAL: For authenticated users, don't create session without project_id
    // Session creation requires a project_id for authenticated users
    if (isAuthenticated && !projectId) {
      console.log('🔄 [SESSION] useEffect check: Authenticated user needs project_id, skipping session creation')
      return
    }
    
    // Check if session creation was blocked (due to missing project or server error)
    let isSessionCreationBlocked = false
    if (typeof window !== 'undefined') {
      try {
        const blocked = localStorage.getItem('chat_session_creation_blocked')
        const errorInfo = localStorage.getItem('chat_session_error')
        if (blocked === 'true') {
          isSessionCreationBlocked = true
          // Check if it was a server error (500/503) or a client error
          if (errorInfo) {
            try {
              const error = JSON.parse(errorInfo)
              // For server errors, keep blocking until manual retry or page reload
              if (error.statusCode === 500 || error.statusCode === 503) {
                console.log('🔄 [SESSION] Session creation blocked due to server error (500/503)')
                return // Don't try to create session if we had a server error
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
          // Only keep it blocked if still missing project_id (for 400/404 errors)
          if (!projectId) {
            console.log('🔄 [SESSION] Session creation previously blocked, still missing project_id')
          } else {
            // Clear the block if we now have project_id (might have been a transient error)
            localStorage.removeItem('chat_session_creation_blocked')
            localStorage.removeItem('chat_session_error')
          }
        }
      } catch (error) {
        // Ignore localStorage errors
      }
    }
    
    // Check if there's a valid session in localStorage before creating a new one
    let hasValidLocalStorageSession = false
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(SESSION_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.sessionId && parsed.sessionId.trim()) {
            hasValidLocalStorageSession = true
            console.log('🔄 [SESSION] useEffect check: Valid session found in localStorage, skipping creation')
          }
        }
      } catch (error) {
        console.error('Error checking localStorage session:', error)
      }
    }
    
    const shouldCreateSession = (
      !authLoading && 
      !sessionState.isLoading && 
      !sessionCreationInProgress.current &&
      !globalSessionCreationInProgress &&
      !hasValidLocalStorageSession && // Don't create if there's a valid session in localStorage
      (!isAuthenticated || projectId) && // Authenticated users need project_id
      !isSessionCreationBlocked // Don't retry if previous attempt was blocked
    )
    
    console.log('🔄 [SESSION] useEffect check:', {
      sessionId,
      projectId,
      authLoading,
      sessionStateIsLoading: sessionState.isLoading,
      sessionCreationInProgress: sessionCreationInProgress.current,
      globalSessionCreationInProgress,
      sessionStateSessionId: sessionState.sessionId,
      hasValidLocalStorageSession,
      isAuthenticated,
      shouldCreateSession
    })
    
    if (shouldCreateSession) {
      console.log('🔄 [SESSION] Triggering session creation from useEffect')
      // Add delay for authenticated users to allow database transaction to commit
      // Longer delay needed for project creation → session creation flow
      if (isAuthenticated) {
        // Use a longer delay to ensure database transaction is committed
        const timeoutId = setTimeout(() => {
          createSession()
        }, 1500) // 1.5 seconds for project creation flow
        
        // Cleanup timeout on unmount
        return () => clearTimeout(timeoutId)
      } else {
        createSession()
      }
    }
  }, [sessionId, projectId, authLoading, sessionState.isLoading, sessionState.sessionId, createSession, isAuthenticated])

  // Check if session is expired
  const isSessionExpired = useCallback(() => {
    if (!sessionState.expiresAt) return false
    return Date.now() > sessionState.expiresAt * 1000
  }, [sessionState.expiresAt])

  // Clear session
  const clearSession = useCallback(() => {
    setSessionState({
      sessionId: null,
      projectId: null,
      isAuthenticated: false,
      expiresAt: null,
      isLoading: true
    })
    
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      console.log('Session cleared from localStorage')
    }
  }, [])

  // Get session info for API calls
  const getSessionInfo = useCallback(() => {
    return {
      sessionId: sessionState.sessionId,
      projectId: sessionState.projectId,
      isAuthenticated: sessionState.isAuthenticated
    }
  }, [sessionState])

  return {
    ...sessionState,
    isSessionExpired: isSessionExpired(),
    createSession,
    clearSession,
    getSessionInfo
  }
}