'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { auth, supabase } from './supabase'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'

interface User {
  id?: string
  user_id?: string
  username?: string
  email?: string
  display_name?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [migrationAttempted, setMigrationAttempted] = useState(false)
  const [userSynced, setUserSynced] = useState(false)

  // Convert Supabase user to our User interface
  const convertSupabaseUser = useCallback((supabaseUser: SupabaseUser | null): User | null => {
    if (!supabaseUser) return null
    
    return {
      user_id: supabaseUser.id,
      email: supabaseUser.email,
      display_name: supabaseUser.user_metadata?.display_name || supabaseUser.email?.split('@')[0],
      avatar_url: supabaseUser.user_metadata?.avatar_url,
      created_at: supabaseUser.created_at,
      updated_at: supabaseUser.updated_at
    }
  }, [])

  // Save user to localStorage whenever user state changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
  }, [user])

  // Check for existing user on mount (token-based auth)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for stored token and user
        const storedToken = localStorage.getItem('auth_token')
        const storedUser = localStorage.getItem('auth_user')
        
        if (storedToken && storedUser) {
          try {
            // Restore user from localStorage immediately (for faster UX)
            const parsedUser = JSON.parse(storedUser)
            const userData: User = {
              id: parsedUser.user_id || parsedUser.id,
              user_id: parsedUser.user_id || parsedUser.id,
              username: parsedUser.username || 'User',
              email: parsedUser.email || '',
              display_name: parsedUser.display_name || parsedUser.username || 'User',
              avatar_url: parsedUser.avatar_url || null
            }
            
            // Set user immediately from stored data
            setUser(userData)
            setIsLoading(false) // Allow UI to render while validating
            
            // Then verify token is still valid by checking user info
            try {
              const { authApi } = await import('./api')
              const userInfo = await authApi.getCurrentUser() as any
              
              // Update with fresh data from server
              const freshUserData: User = {
                id: userInfo?.user_id || userInfo?.id,
                user_id: userInfo?.user_id || userInfo?.id,
                username: userInfo?.username || 'User',
                email: userInfo?.email || '',
                display_name: userInfo?.display_name || userInfo?.username || 'User',
                avatar_url: userInfo?.avatar_url || null
              }
              
              setUser(freshUserData)
              // Update stored user data
              localStorage.setItem('auth_user', JSON.stringify(freshUserData))
            } catch (validationError) {
              // Token invalid, but keep user for now if we have stored data
              // Only clear if it's a 401 (unauthorized)
              if (validationError && typeof validationError === 'object' && 'response' in validationError) {
                const response = (validationError as { response?: { status?: number } }).response
                if (response?.status === 401) {
                  console.warn('Token expired, clearing auth data')
                  localStorage.removeItem('auth_token')
                  localStorage.removeItem('auth_user')
                  setUser(null)
                } else {
                  console.warn('Token validation failed, but keeping stored user:', validationError)
                }
              } else {
                console.warn('Token validation failed, but keeping stored user:', validationError)
              }
            }
          } catch (parseError) {
            // Invalid stored user data, clear it
            console.warn('Invalid stored user data, clearing:', parseError)
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
            setUser(null)
            setIsLoading(false)
          }
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    try {
      setIsLoading(true)
      const { authApi } = await import('./api')
      const response = await authApi.login(username, password)
      
      // Store token and user info
      if (response.access_token) {
        localStorage.setItem('auth_token', response.access_token)
        localStorage.setItem('auth_user', JSON.stringify(response.user))
        
        // Convert to User type for compatibility
            const userData: User = {
              id: response?.user?.user_id || 'single_client',
              user_id: response?.user?.user_id || 'single_client',
              email: response?.user?.email || '',
              display_name: response?.user?.display_name || response?.user?.username || 'User',
              avatar_url: response?.user?.avatar_url || null,
              username: response?.user?.username || 'User'
            }
        
        setUser(userData)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Signup removed - single client system

  const logout = useCallback(async () => {
    try {
      setIsLoading(true)
      // Try to call logout API (optional, might fail if token is invalid)
      try {
        const { authApi } = await import('./api')
        await authApi.logout()
      } catch (apiError) {
        // Ignore API errors - we'll clear local storage anyway
        console.warn('Logout API call failed (continuing with local logout):', apiError)
      }
      
      // Clear token and user data
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      setUser(null)
      
      // Clear any stored session data
      localStorage.removeItem('stories_we_tell_session')
      localStorage.removeItem('anonymous_session_id')
      localStorage.removeItem('anonymous_project_id')
      localStorage.removeItem('anonymous_session_expires_at')
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (data: Partial<User>) => {
    if (!user) return

    try {
      // Update user metadata in Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: data.display_name,
          avatar_url: data.avatar_url
        }
      })
      
      if (error) {
        throw new Error(error.message)
      }
      
      // Update local state
      const updatedUser = { ...user, ...data }
      setUser(updatedUser)
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }, [user])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
