import ky from 'ky'
import { supabase } from './supabase'

// Get user ID and session info from current Supabase session (not localStorage to avoid stale data)
const getUserHeaders = async () => {
  if (typeof window === 'undefined') return {}
  
  try {
    // Get current Supabase session to ensure we use the correct user ID
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ [API] Error getting Supabase session:', error)
    }
    
    const headers: Record<string, string> = {}
    
    if (session?.user) {
      // Check if backend has a different user_id for this email (backend is source of truth)
      // This happens when user logs in with different Supabase account but same email
      const backendUserId = typeof window !== 'undefined' ? localStorage.getItem('backend_user_id') : null
      
      if (backendUserId) {
        // Use backend user_id (source of truth) instead of Supabase Auth user_id
        headers['X-User-ID'] = backendUserId
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [API] Using backend user ID (from email lookup):', backendUserId)
          console.log('   Supabase Auth user ID:', session.user.id)
        }
      } else {
        // Use the current Supabase user ID
        headers['X-User-ID'] = session.user.id
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [API] Using Supabase user ID:', session.user.id)
        }
      }
    } else {
      // No active session - this shouldn't happen for authenticated users
      console.warn('⚠️ [API] No active Supabase session found')
      // Don't use localStorage fallback - force user to log in again
    }
    
    // Get session ID from localStorage (chat session, not auth session)
    const chatSession = localStorage.getItem('chat_session')
    if (chatSession) {
      try {
        const sessionData = JSON.parse(chatSession)
        if (sessionData.sessionId) {
          headers['X-Session-ID'] = sessionData.sessionId
        }
      } catch (e) {
        console.error('❌ Error parsing chat session:', e)
      }
    }
    
    return headers
  } catch (error) {
    console.error('❌ Error getting user headers:', error)
  }
  
  return {}
}

export const api = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
  timeout: 30000,
  retry: 2,
  hooks: {
    beforeRequest: [
      async (request) => {
        // Add user ID header to all requests (async to get current Supabase session)
        const headers = await getUserHeaders()
        Object.entries(headers).forEach(([key, value]) => {
          request.headers.set(key, value)
        })
        
        // Add Authorization header if token is available
        if (typeof window !== 'undefined') {
          // Get token from Supabase session instead of localStorage
          try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.access_token) {
              request.headers.set('Authorization', `Bearer ${session.access_token}`)
            } else {
              // Fallback to localStorage
              const token = localStorage.getItem('access_token')
              if (token) {
                request.headers.set('Authorization', `Bearer ${token}`)
              }
            }
          } catch (error) {
            console.error('❌ Error getting auth token:', error)
            // Fallback to localStorage
            const token = localStorage.getItem('access_token')
            if (token) {
              request.headers.set('Authorization', `Bearer ${token}`)
            }
          }
        }
      }
    ]
  }
})

// API endpoints for the new session-based system
export const sessionApi = {
  // Chat with session support
  chat: (text: string, sessionId?: string) => {
    // Headers are automatically added by beforeRequest hook
    return api.post('api/v1/chat', { 
      json: { text, session_id: sessionId }
    })
  },
  
  // Get user sessions
  getSessions: async (limit = 10) => {
    try {
      const result = await api.get('api/v1/sessions', { 
        searchParams: { limit }
      }).json()
      return result
        } catch (error: unknown) {
          console.error('❌ getSessions error:', error)
          if (error && typeof error === 'object' && 'response' in error && 
              error.response && typeof error.response === 'object' && 'status' in error.response &&
              error.response.status === 404) {
            return []
          }
          throw error
        }
  },
  
  // Get session messages
  getSessionMessages: async (sessionId: string, limit = 50, offset = 0) => {
    try {
      // Headers are automatically added by beforeRequest hook
      return await api.get(`api/v1/sessions/${sessionId}/messages`, { 
        searchParams: { limit, offset }
      }).json()
    } catch (error: unknown) {
      // For session validation, we need 404s to be thrown as errors
      // so the validation can detect invalid sessions
      throw error
    }
  },
  
  // Update session title
  updateSessionTitle: (sessionId: string, title: string) => 
    api.put(`api/v1/sessions/${sessionId}/title`, { json: { title } }).json(),
  
  // Delete session
  deleteSession: async (sessionId: string) => {
    try {
      return await api.delete(`api/v1/sessions/${sessionId}`).json()
        } catch (error: unknown) {
          if (error && typeof error === 'object' && 'response' in error && 
              error.response && typeof error.response === 'object' && 'status' in error.response &&
              error.response.status === 404) {
            return { success: false, message: 'API not available' }
          }
          throw error
        }
  },

  // Delete all sessions
  deleteAllSessions: async () => {
    try {
      return await api.delete('api/v1/sessions').json()
        } catch (error: unknown) {
          if (error && typeof error === 'object' && 'response' in error && 
              error.response && typeof error.response === 'object' && 'status' in error.response &&
              error.response.status === 404) {
            return { success: false, message: 'API not available' }
          }
          throw error
        }
  },
  
  // Create user
  createUser: async (userData: { user_id?: string; email?: string; display_name?: string; avatar_url?: string }) => {
    try {
      return await api.post('api/v1/users', { json: userData }).json()
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error && 
          error.response && typeof error.response === 'object' && 'status' in error.response &&
          error.response.status === 409) {
        // User already exists, that's fine
        return { message: 'User already exists', user: userData }
      }
      throw error
    }
  },
  
  // Get current user
  getCurrentUser: async () => {
    // Headers are automatically added by beforeRequest hook
    return await api.get('api/v1/users/me').json()
  },
  
  // Create or get session
  getOrCreateSession: async (sessionId?: string) => {
    // Get headers for debug logging
    const headers = await getUserHeaders()
    
    // Ensure we have a user ID
    if (!headers['X-User-ID']) {
      console.error('❌ [API] Cannot create session: No user ID found')
      throw new Error('User not authenticated')
    }
    
    // Log user ID for debugging (only in development)
    if (process.env.NODE_ENV === 'development' && headers['X-User-ID']) {
      console.log('🔍 [API] Creating session for user:', headers['X-User-ID'])
    }
    
    try {
      // Build request body - FastAPI Body(None) accepts null or the field being omitted
      // We'll send null explicitly to be safe
      const jsonBody: { session_id: string | null } = {
        session_id: (sessionId && sessionId.trim()) ? sessionId : null
      }
      
      // Headers are automatically added by beforeRequest hook, but we can also pass them explicitly
      return await api.post('api/v1/session', {
        json: jsonBody
      }).json()
    } catch (error: unknown) {
      // ky throws HTTPError with response property
      if (error && typeof error === 'object' && 'response' in error) {
        const httpError = error as any
        const status = httpError.response?.status
        
        if (status === 404) {
          // Try to get error message from response
          try {
            const errorData = await httpError.response.json()
            
            // If error says "User not found", try to sync the user first
            if (errorData.detail && errorData.detail.includes('User not found')) {
              console.warn('⚠️ [API] User not found in backend, attempting to sync user...')
              
              // Get current Supabase session to sync user
              const { data: { session } } = await supabase.auth.getSession()
              if (session?.user) {
                // Sync user to backend
                try {
                  await sessionApi.createUser({
                    user_id: session.user.id,
                    email: session.user.email,
                    display_name: session.user.user_metadata?.display_name || session.user.email?.split('@')[0],
                    avatar_url: session.user.user_metadata?.avatar_url
                  })
                  
                  console.log('✅ [API] User synced, retrying session creation...')
                  
                  // Retry session creation after user sync
                  const jsonBody: { session_id: string | null } = {
                    session_id: (sessionId && sessionId.trim()) ? sessionId : null
                  }
                  
                  return await api.post('api/v1/session', {
                    json: jsonBody
                  }).json()
                } catch (syncError) {
                  console.error('❌ [API] Failed to sync user:', syncError)
                  throw error // Throw original error
                }
              } else {
                console.error('❌ [API] No Supabase session available to sync user')
                throw error
              }
            } else {
              // Other 404 error (e.g., endpoint not available)
              return {
                success: false,
                session_id: sessionId || null,
                created: false
              }
            }
          } catch (e) {
            // Response might not be JSON or already consumed
            console.error('❌ [API] Could not parse error response:', e)
            throw error
          }
        }
      }
      
      throw error
    }
  },
  
  // Anonymous session migration removed - authentication required
  
  // Cleanup expired sessions
  cleanupExpiredSessions: () =>
    api.post('api/v1/cleanup-expired').json()
}

// Projects API - for managing user projects (stories)
export const projectApi = {
  // Create a new project
  createProject: async (name: string, description?: string) => {
    // Headers are automatically added by beforeRequest hook
    return await api.post('api/v1/projects', {
      json: { name, description }
    }).json<{
      project_id: string
      name: string
      description?: string
      user_id: string
      created_at: string
      updated_at: string
      session_count: number
    }>()
  },
  
  // Get all projects for user
  getProjects: async () => {
    // Headers are automatically added by beforeRequest hook
    return await api.get('api/v1/projects').json<{
      projects: Array<{
        project_id: string
        name: string
        description?: string
        user_id: string
        created_at: string
        updated_at: string
        session_count: number
      }>
      count: number
    }>()
  },
  
  // Get specific project with sessions
  getProject: async (projectId: string) => {
    // Headers are automatically added by beforeRequest hook
    return await api.get(`api/v1/projects/${projectId}`).json<{
      project_id: string
      name: string
      description?: string
      user_id: string
      created_at: string
      updated_at: string
      session_count: number
      sessions: Array<{
        session_id: string
        title: string
        created_at: string
        last_message_at: string
        is_active: boolean
      }>
    }>()
  },
  
  // Delete a project
  deleteProject: async (projectId: string) => {
    // Headers are automatically added by beforeRequest hook
    return await api.delete(`api/v1/projects/${projectId}`).json()
  },

  // Rename a project (updates dossier title)
  renameProject: async (projectId: string, name: string) => {
    // Headers are automatically added by beforeRequest hook
    return await api.put(`api/v1/projects/${projectId}/name`, {
      json: { name }
    }).json<{ success: boolean; project_id: string; name: string }>()
  },
}

// Authentication API
export const authApi = {
  // Login with email and password
  login: (email: string, password: string) =>
    api.post('api/v1/auth/login', { 
      json: { email, password } 
    }).json(),
  
  // Signup with email, display name, and password
  signup: (email: string, displayName: string, password: string) =>
    api.post('api/v1/auth/signup', { 
      json: { email, display_name: displayName, password } 
    }).json(),
  
  // Google OAuth authentication
  googleAuth: (token: string, email: string, name: string, picture?: string) =>
    api.post('api/v1/auth/google', { 
      json: { token, email, name, picture } 
    }).json(),
  
  // Get current user info
  getCurrentUser: () =>
    api.get('api/v1/auth/me').json(),
  
  // Refresh access token
  refreshToken: () =>
    api.post('api/v1/auth/refresh').json(),
  
  // Logout
  logout: () =>
    api.post('api/v1/auth/logout').json()
}
