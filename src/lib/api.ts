import ky from 'ky'

// Get user ID and session info from localStorage for API calls
const getUserHeaders = () => {
  if (typeof window === 'undefined') return {}
  
  try {
    const user = localStorage.getItem('user')
    const session = localStorage.getItem('chat_session')
    
    const headers: Record<string, string> = {}
    
    if (user) {
      const userData = JSON.parse(user)
      headers['X-User-ID'] = userData.user_id
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
  prefixUrl: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
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
          const token = localStorage.getItem('access_token')
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
  
  // Get current user
  getCurrentUser: () => {
    const headers = getUserHeaders()
    return api.get('api/v1/users/me', { headers }).json()
  },
  
  // Create or get session
  getOrCreateSession: async (sessionId?: string, projectId?: string) => {
    const headers = getUserHeaders()
    try {
      return await api.post('api/v1/session', {
        json: { session_id: sessionId, project_id: projectId },
        headers
      }).json()
    } catch (error: unknown) {
      console.error('❌ getOrCreateSession error:', error)
      if (error && typeof error === 'object' && 'response' in error && 
          error.response && typeof error.response === 'object' && 'status' in error.response &&
          error.response.status === 404) {
        // Session endpoint not available, return mock response
        return {
          success: false,
          session_id: sessionId || null,
          project_id: projectId || null,
          created: false
        }
      }
      throw error
    }
  },
  
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

// Projects API - for managing user projects (stories)
export const projectApi = {
  // Create a new project
  createProject: async (name: string, description?: string) => {
    const headers = getUserHeaders()
    return await api.post('api/v1/projects', {
      json: { name, description },
      headers
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
    const headers = getUserHeaders()
    return await api.get('api/v1/projects', {
      headers
    }).json<{
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
    const headers = getUserHeaders()
    return await api.get(`api/v1/projects/${projectId}`, {
      headers
    }).json<{
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
    const headers = getUserHeaders()
    return await api.delete(`api/v1/projects/${projectId}`, {
      headers
    }).json()
  },

  // Rename a project (updates dossier title)
  renameProject: async (projectId: string, name: string) => {
    const headers = getUserHeaders()
    return await api.put(`api/v1/projects/${projectId}/name`, {
      json: { name },
      headers
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
