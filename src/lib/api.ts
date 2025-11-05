import ky from 'ky'

// Get user ID and session info from localStorage for API calls
const getUserHeaders = () => {
  if (typeof window === 'undefined') return {}
  
  try {
    // For single-client system, get user from auth_user (set during login)
    const authUser = localStorage.getItem('auth_user')
    const session = localStorage.getItem('stories_we_tell_session')
    
    const headers: Record<string, string> = {}
    
    // Use auth_user if available (from login), otherwise fallback to user
    if (authUser) {
      const userData = JSON.parse(authUser)
      // Only send X-User-ID if it's a valid UUID format
      // Backend will use SINGLE_USER_ID anyway, but this prevents errors
      if (userData.user_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userData.user_id)) {
        headers['X-User-ID'] = userData.user_id
      }
    } else {
      // Fallback to old user storage (for backwards compatibility)
      const user = localStorage.getItem('user')
      if (user) {
        const userData = JSON.parse(user)
        if (userData.user_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userData.user_id)) {
          headers['X-User-ID'] = userData.user_id
        }
      }
    }
    
    if (session) {
      const sessionData = JSON.parse(session)
      if (sessionData.sessionId) {
        headers['X-Session-ID'] = sessionData.sessionId
      }
      if (sessionData.projectId) {
        headers['X-Project-ID'] = sessionData.projectId
      }
    }
    
    return headers
  } catch (error) {
    console.error('❌ Error getting user headers:', error)
  }
  
  return {}
}

export const api = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL || 'https://simon-backend-blond.vercel.app',
  timeout: 30000,
  retry: 2,
  hooks: {
    beforeRequest: [
      (request) => {
        // Add user ID header to all requests
        const headers = getUserHeaders()
        Object.entries(headers).forEach(([key, value]) => {
          request.headers.set(key, value)
        })
        
        // Add Authorization header if token is available
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('auth_token')
          if (token) {
            request.headers.set('Authorization', `Bearer ${token}`)
          }
        }
      }
    ]
  }
})

// API endpoints for the new session-based system
export const sessionApi = {
  // Chat with session support
  chat: (text: string, sessionId?: string, projectId?: string) => {
    const headers = getUserHeaders()
    return api.post('api/v1/chat', { 
      json: { text, session_id: sessionId, project_id: projectId },
      headers
    })
  },
  
  // Get user sessions - simplified for single-user personal assistant
  getSessions: async (limit = 10) => {
    try {
      // For single-user personal assistant, backend uses fixed user ID automatically
      // No need to send X-User-ID header
      const result = await api.get('api/v1/sessions', { 
        searchParams: { limit }
      }).json()
      return result
    } catch (error: unknown) {
      console.error('❌ getSessions error:', error)
      // Return empty result on error to prevent UI crashes
      return { success: true, sessions: [] }
    }
  },
  
  // Get session messages
  getSessionMessages: async (sessionId: string, limit = 50, offset = 0) => {
    try {
      const headers = getUserHeaders()
      return await api.get(`api/v1/sessions/${sessionId}/messages`, { 
        searchParams: { limit, offset },
        headers
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
  
  // Get current user (uses JWT token from Authorization header)
  getCurrentUser: async () => {
    // Get auth token and set Authorization header
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    const headers: Record<string, string> = {}
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }
    
    return api.get('api/v1/auth/me', { headers }).json()
  },
  
  // Simplified session management
  getOrCreateSession: (sessionId?: string, projectId?: string) => 
    api.post('api/v1/session', {
      json: { 
        session_id: sessionId,
        project_id: projectId 
      }
    }).json(),
  
  // Migrate anonymous session to authenticated user
  migrateSession: (anonymousUserId: string, authenticatedUserId: string) =>
    api.post('api/v1/migrate-session', {
      json: { 
        anonymous_user_id: anonymousUserId,
        authenticated_user_id: authenticatedUserId 
      }
    }).json(),
  
  // Cleanup expired sessions
  cleanupExpiredSessions: () =>
    api.post('api/v1/cleanup-expired').json()
}

// Authentication API - Single client system
export const authApi = {
  // Login with username and password
  login: (username: string, password: string) =>
    api.post('api/v1/auth/login', { 
      json: { username, password } 
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

// Coach tools API (MVP, localhost backend)
export const coachApi = {
  scriptwriter: (topic: string, audience?: string, brandVoice?: string) =>
    api.post('api/v1/coach/scriptwriter', { json: { topic, audience, brand_voice: brandVoice } }).json(),
  competitorRewrite: (transcript: string, brandVoice?: string) =>
    api.post('api/v1/coach/competitorrewrite', { json: { transcript, brand_voice: brandVoice } }).json(),
  avatarRefine: (currentAvatar?: string) =>
    api.post('api/v1/coach/avatar_refine', { json: { current_avatar: currentAvatar } }).json(),
  northstarEditor: (doc: string) =>
    api.post('api/v1/coach/northstar_editor', { json: { doc } }).json(),
  contentPlanner: (pillars?: string[], topic?: string) =>
    api.post('api/v1/coach/contentplanner', { json: { pillars, topic } }).json(),
}