import { useState, useEffect, useCallback, useRef } from 'react'
import { sessionApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

// Global session creation guard to prevent multiple simultaneous creations
let globalSessionCreationInProgress = false

// Session persistence key
const SESSION_STORAGE_KEY = 'chat_session'

interface SessionState {
  sessionId: string | null
  isAuthenticated: boolean
  expiresAt: number | null
  isLoading: boolean
}

// Simple session hook that works with props from parent components
export function useSession(sessionId?: string) {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  
  // Try to restore session from localStorage if no sessionId provided
  const getInitialSession = () => {
    if (sessionId && sessionId.trim()) {
      return {
        sessionId: sessionId,
        isAuthenticated,
        expiresAt: null,
        isLoading: false
      }
    }
    
          // Authentication required - no anonymous users
          if (!isAuthenticated) {
            return {
              sessionId: null,
              isAuthenticated: false,
              expiresAt: null,
              isLoading: false
            }
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
                  isAuthenticated: false,
                  expiresAt: null,
                  isLoading: false
                }
              }
            }
            
            return {
              sessionId: parsed.sessionId,
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
      isAuthenticated,
      isLoading: (!sessionId || !sessionId.trim()) && authLoading
    }))
  }, [sessionId, isAuthenticated, authLoading])

  // Create a new session (only when no sessionId is provided or sessionId is empty)
  const createSession = useCallback(async () => {
    // Double-check that we don't have a sessionId prop
    if (sessionId && sessionId.trim()) {
      return
    }
    
    // Double-check that we don't already have a session in state
    if (sessionState.sessionId && sessionState.sessionId.trim()) {
      return
    }

    // Prevent multiple concurrent session creations (both local and global)
    if (sessionCreationInProgress.current || globalSessionCreationInProgress) {
      return
    }

    sessionCreationInProgress.current = true
    globalSessionCreationInProgress = true
    setSessionState(prev => ({ ...prev, isLoading: true }))

    try {
      // REQUIRE AUTHENTICATION
      if (!isAuthenticated) {
        setSessionState(prev => ({ ...prev, isLoading: false }))
        return
      }
      const response = await sessionApi.getOrCreateSession(sessionId) as { 
        success?: boolean; 
        session_id?: string; 
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
      } else if (statusCode === 400 || statusCode === 404) {
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
  }, [sessionId, sessionState.sessionId, isAuthenticated])

  // Listen for session updates from other components
  useEffect(() => {
    const handleSessionUpdate = (event: CustomEvent) => {
      const { sessionId: newSessionId } = event.detail || {}
      
      if (newSessionId && newSessionId !== sessionState.sessionId) {
        setSessionState(prev => ({
          ...prev,
          sessionId: newSessionId,
          isLoading: false
        }))
        
        // Also verify localStorage has the correct session
        setTimeout(() => {
          try {
            const stored = localStorage.getItem(SESSION_STORAGE_KEY)
            if (stored) {
              const parsed = JSON.parse(stored)
              if (parsed.sessionId !== newSessionId) {
                // localStorage session mismatch - will be corrected
                // Force localStorage update
                localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
                  sessionId: newSessionId,
                  isAuthenticated: sessionState.isAuthenticated
                }))
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
              setSessionState(prev => ({
                ...prev,
                sessionId: parsed.sessionId,
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
      return
    }
    
    // Don't create session if we already have a session in state
    if (sessionState.sessionId && sessionState.sessionId.trim()) {
      return
    }
    
    // REQUIRE AUTHENTICATION
    if (!isAuthenticated) {
      return
    }
    
    // Check if session creation was blocked (due to server error)
    let isSessionCreationBlocked = false
    if (typeof window !== 'undefined') {
      try {
        const blocked = localStorage.getItem('chat_session_creation_blocked')
        const errorInfo = localStorage.getItem('chat_session_error')
        if (blocked === 'true') {
          isSessionCreationBlocked = true
          // Check if it was a server error (500/503)
          if (errorInfo) {
            try {
              const error = JSON.parse(errorInfo)
              // For server errors, keep blocking until manual retry or page reload
              if (error.statusCode === 500 || error.statusCode === 503) {
                return // Don't try to create session if we had a server error
              }
            } catch (e) {
              // Ignore parse errors
            }
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
      isAuthenticated && // Only authenticated users can create sessions
      !isSessionCreationBlocked // Don't retry if previous attempt was blocked
    )
    
    if (shouldCreateSession) {
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
  }, [sessionId, authLoading, sessionState.isLoading, sessionState.sessionId, createSession, isAuthenticated])

  // Check if session is expired
  const isSessionExpired = useCallback(() => {
    if (!sessionState.expiresAt) return false
    return Date.now() > sessionState.expiresAt * 1000
  }, [sessionState.expiresAt])

  // Clear session
  const clearSession = useCallback(() => {
    setSessionState({
      sessionId: null,
      isAuthenticated: false,
      expiresAt: null,
      isLoading: true
    })
    
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }, [])
  
  // Get session info for API calls
  const getSessionInfo = useCallback(() => {
    return {
      sessionId: sessionState.sessionId,
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