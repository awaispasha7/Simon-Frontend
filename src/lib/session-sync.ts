/**
 * Session Sync Utility
 * 
 * Keeps localStorage sessions in sync with the backend database
 * Handles validation, cleanup, and migration of sessions
 */

import { sessionApi } from './api'

export interface StoredSession {
  sessionId: string
  projectId?: string
  userId?: string
  isAuthenticated?: boolean
  lastValidated?: number
}

export interface SessionValidationResult {
  isValid: boolean
  reason?: 'not_found' | 'access_denied' | 'user_mismatch' | 'corrupted' | 'session_not_found_403' | 'session_not_found_404'
  session?: StoredSession
}

const SESSION_STORAGE_KEY = 'stories_we_tell_session'
const SESSION_VALIDATION_INTERVAL = 10 * 60 * 1000 // 10 minutes
const SESSION_CLEANUP_INTERVAL = 60 * 60 * 1000 // 60 minutes

class SessionSyncManager {
  private validationTimer: NodeJS.Timeout | null = null
  private cleanupTimer: NodeJS.Timeout | null = null
  private isInitialized = false

  /**
   * Initialize the session sync manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    console.log('🔄 Initializing session sync manager...')
    
    // Perform initial cleanup and validation
    await this.performInitialSync()
    
    // Set up periodic validation
    this.startPeriodicValidation()
    
    // Set up periodic cleanup
    this.startPeriodicCleanup()
    
    this.isInitialized = true
    console.log('✅ Session sync manager initialized')
  }

  /**
   * Perform initial sync on app startup
   */
  private async performInitialSync(): Promise<void> {
    try {
      const storedSession = this.getStoredSession()
      if (!storedSession) {
        console.log('📝 No stored session found')
        return
      }

          // For anonymous users, check for existing session
          const currentUser = this.getCurrentUser()
          if (!currentUser) {
            console.log('🔄 [DEMO] Anonymous user - checking for existing session')
          }

      console.log('🔍 Validating stored session:', storedSession.sessionId)
      
      // Validate the stored session
      const validation = await this.validateSession(storedSession)
      
      if (!validation.isValid) {
        console.log(`❌ Invalid session found: ${validation.reason}`)
        await this.cleanupInvalidSession(validation.reason || 'unknown')
      } else {
        console.log('✅ Stored session is valid')
        // Update last validated timestamp
        this.updateSessionValidation()
      }
      
      // Clean up empty sessions periodically
      await this.cleanupEmptySessions()
    } catch (error) {
      console.error('❌ Error during initial sync:', error)
      // Clear potentially corrupted session data
      this.clearStoredSession()
    }
  }

  /**
   * Validate a session against the backend
   */
  async validateSession(session: StoredSession): Promise<SessionValidationResult> {
    try {
      // Check if session belongs to current user
      const currentUser = this.getCurrentUser()
      if (currentUser && session.userId && session.userId !== currentUser.user_id) {
        return {
          isValid: false,
          reason: 'user_mismatch',
          session
        }
      }

      // Try to fetch session messages (this validates the session exists and user has access)
      // We don't care if the session is empty - we just want to know if it exists and is accessible
      try {
        console.log(`🔍 [SYNC] Attempting to validate session: ${session.sessionId}`)
        await sessionApi.getSessionMessages(session.sessionId, 1, 0)
        console.log(`✅ [SYNC] Session validation successful: ${session.sessionId}`)
        return {
          isValid: true,
          session
        }
      } catch (error) {
        console.log(`❌ [SYNC] Session validation failed for ${session.sessionId}:`, error)
        console.log(`🔍 [SYNC] Error type:`, typeof error)
        console.log(`🔍 [SYNC] Error constructor:`, error?.constructor?.name)
        console.log(`🔍 [SYNC] Error keys:`, error ? Object.keys(error) : 'no keys')
        
        // If we get a 404 or 403, the session doesn't exist or user doesn't have access
        if (error && typeof error === 'object' && 'response' in error &&
            error.response && typeof error.response === 'object' && 'status' in error.response) {
          const status = error.response.status
          console.log(`🔍 [SYNC] Error status: ${status}`)
          if (status === 403 || status === 404) {
            console.log(`❌ [SYNC] Session not found (${status}): ${session.sessionId}`)
            return {
              isValid: false,
              reason: `session_not_found_${status}`,
              session
            }
          }
        }
        // For other errors, assume session is valid (network issues, etc.)
        console.log(`⚠️ [SYNC] Assuming session is valid due to network error: ${session.sessionId}`)
        return {
          isValid: true,
          session
        }
      }
    } catch (error: unknown) {
      console.log(`❌ [SYNC] Outer catch block triggered for ${session.sessionId}:`, error)
      if (error && typeof error === 'object' && 'response' in error &&
          error.response && typeof error.response === 'object' && 'status' in error.response &&
          error.response.status === 404) {
        console.log(`❌ [SYNC] Outer catch: Session not found (404): ${session.sessionId}`)
        return {
          isValid: false,
          reason: 'not_found',
          session
        }
      } else if (error && typeof error === 'object' && 'response' in error &&
          error.response && typeof error.response === 'object' && 'status' in error.response &&
          error.response.status === 403) {
        console.log(`❌ [SYNC] Outer catch: Access denied (403): ${session.sessionId}`)
        return {
          isValid: false,
          reason: 'access_denied',
          session
        }
      } else {
        console.log(`❌ [SYNC] Outer catch: Corrupted session: ${session.sessionId}`)
        return {
          isValid: false,
          reason: 'corrupted',
          session
        }
      }
    }
  }

  /**
   * Clean up invalid session
   */
  private async cleanupInvalidSession(reason: string): Promise<void> {
    console.log(`🧹 Cleaning up invalid session: ${reason}`)
    
    // Clear from localStorage
    this.clearStoredSession()
    
    // Notify components that session was cleared
    this.notifySessionCleared(reason)
  }

  /**
   * Clean up empty sessions from the backend
   */
  private async cleanupEmptySessions(): Promise<void> {
    try {
      console.log('🧹 Cleaning up empty sessions...')
      
      // Get the currently active session from localStorage to avoid deleting it
      const currentSessionId = this.getStoredSession()?.sessionId
      console.log('🔒 Current active session (protected from deletion):', currentSessionId)
      
      // If no current session, skip cleanup to avoid deleting sessions that might be in use
      if (!currentSessionId) {
        console.log('⚠️ No current session found in localStorage, skipping cleanup to avoid deleting active sessions')
        return
      }
      
      // Get all sessions for the current user
      const { sessionApi } = await import('./api')
      const result = await sessionApi.getSessions(100) // Get more sessions for cleanup
      const sessions = (result as { sessions?: unknown[] })?.sessions || []
      
      if (sessions.length === 0) {
        console.log('📝 No sessions to clean up')
        return
      }
      
      // Check each session for messages
      const emptySessions = []
      for (const session of sessions) {
        const sessionData = session as { session_id?: string; created_at?: string }
        console.log(`🔍 Checking session: ${sessionData.session_id} (current: ${currentSessionId})`)
        
        // Skip the currently active session - don't delete it even if it appears empty
        if (currentSessionId && sessionData.session_id === currentSessionId) {
          console.log(`🔒 Skipping cleanup for active session: ${sessionData.session_id}`)
          continue
        }
        
        // Skip sessions that are very recent (less than 5 minutes old) to avoid deleting sessions that might be in use
        const sessionAge = Date.now() - new Date(sessionData.created_at || '').getTime()
        const fiveMinutes = 5 * 60 * 1000
        if (sessionAge < fiveMinutes) {
          console.log(`⏰ Skipping recent session (${Math.round(sessionAge / 1000)}s old): ${sessionData.session_id}`)
          continue
        }
        
        try {
          const messagesResponse = await sessionApi.getSessionMessages(sessionData.session_id || '', 1, 0)
          const messages = (messagesResponse as { messages?: unknown[] })?.messages || []
          
          if (messages.length === 0 && sessionData.session_id) {
            emptySessions.push(sessionData.session_id)
          }
        } catch (error) {
          // If getSessionMessages returns 404, it's also an empty/invalid session
          if (error && typeof error === 'object' && 'response' in error && 
              error.response && typeof error.response === 'object' && 'status' in error.response &&
              (error.response.status === 403 || error.response.status === 404)) {
            if (sessionData.session_id) {
              emptySessions.push(sessionData.session_id);
            }
          } else {
            console.warn(`Failed to check messages for session ${sessionData.session_id}:`, error)
          }
        }
      }
      
      if (emptySessions.length > 0) {
        console.log(`🧹 Found ${emptySessions.length} empty sessions to clean up`)
        
        // Delete empty sessions
        for (const sessionId of emptySessions) {
          try {
            await sessionApi.deleteSession(sessionId)
            console.log(`✅ Deleted empty session: ${sessionId}`)
          } catch (error) {
            console.warn(`Failed to delete empty session ${sessionId}:`, error)
          }
        }
        
        console.log(`🧹 Cleaned up ${emptySessions.length} empty sessions`)
      } else {
        console.log('✅ No empty sessions found')
      }
    } catch (error) {
      console.error('❌ Error during empty session cleanup:', error)
    }
  }

  /**
   * Get stored session from localStorage
   */
  private getStoredSession(): StoredSession | null {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY)
      if (!stored) return null
      
      const parsed = JSON.parse(stored)
      return {
        sessionId: parsed.sessionId,
        projectId: parsed.projectId,
        userId: parsed.userId,
        isAuthenticated: parsed.isAuthenticated,
        lastValidated: parsed.lastValidated
      }
    } catch (error) {
      console.error('❌ Error parsing stored session:', error)
      return null
    }
  }

  /**
   * Get current user from localStorage
   */
  private getCurrentUser(): { user_id: string } | null {
    try {
      const user = localStorage.getItem('user')
      if (!user) return null
      return JSON.parse(user)
    } catch (error) {
      console.error('❌ Error parsing current user:', error)
      return null
    }
  }

  /**
   * Clear stored session from localStorage
   */
  private clearStoredSession(): void {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    } catch (error) {
      console.error('❌ Error clearing stored session:', error)
    }
  }

  /**
   * Update session validation timestamp
   */
  private updateSessionValidation(): void {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        parsed.lastValidated = Date.now()
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed))
      }
    } catch (error) {
      console.error('❌ Error updating session validation:', error)
    }
  }

  /**
   * Start periodic session validation
   */
  private startPeriodicValidation(): void {
    this.validationTimer = setInterval(async () => {
      try {
        const storedSession = this.getStoredSession()
        if (!storedSession) return

        // Check if session needs validation
        const now = Date.now()
        const lastValidated = storedSession.lastValidated || 0
        if (now - lastValidated < SESSION_VALIDATION_INTERVAL) {
          return // Too soon to validate again
        }

        console.log('🔄 Periodic session validation...')
        const validation = await this.validateSession(storedSession)
        
        if (!validation.isValid) {
          console.log(`❌ Session validation failed: ${validation.reason}`)
          await this.cleanupInvalidSession(validation.reason || 'unknown')
        } else {
          this.updateSessionValidation()
        }
      } catch (error) {
        console.error('❌ Error during periodic validation:', error)
      }
    }, SESSION_VALIDATION_INTERVAL)
  }

  /**
   * Start periodic cleanup
   */
  private startPeriodicCleanup(): void {
    this.cleanupTimer = setInterval(async () => {
      try {
        console.log('🧹 Periodic session cleanup...')
        await this.performInitialSync()
      } catch (error) {
        console.error('❌ Error during periodic cleanup:', error)
      }
    }, SESSION_CLEANUP_INTERVAL)
  }

  /**
   * Notify components that session was cleared
   */
  private notifySessionCleared(reason: string): void {
    // Dispatch custom event that components can listen to
    const event = new CustomEvent('sessionCleared', {
      detail: { reason }
    })
    window.dispatchEvent(event)
  }

  /**
   * Force sync with backend
   */
  async forceSync(): Promise<void> {
    console.log('🔄 Force syncing sessions...')
    await this.performInitialSync()
  }

  /**
   * Cleanup and destroy the sync manager
   */
  destroy(): void {
    if (this.validationTimer) {
      clearInterval(this.validationTimer)
      this.validationTimer = null
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    
    this.isInitialized = false
    console.log('🛑 Session sync manager destroyed')
  }
}

// Create singleton instance
export const sessionSyncManager = new SessionSyncManager()

// Note: sessionSyncManager must be manually initialized by calling initialize()
// This prevents multiple initializations and race conditions
