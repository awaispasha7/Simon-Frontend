'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { auth, supabase } from './supabase'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'

interface User {
  user_id: string
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
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, displayName: string) => Promise<unknown>
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

  // Check for existing user on mount and listen to auth changes
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get current session
        const { session } = await auth.getCurrentSession()
        if (session?.user) {
          setUser(convertSupabaseUser(session.user))
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen to auth state changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      const typedSession = session as Session | null
      
      if (event === 'SIGNED_IN' && typedSession?.user) {
        // Ensure user exists in backend (only sync once per session)
        if (!userSynced) {
          try {
            const { sessionApi } = await import('./api')
            await sessionApi.createUser({
              user_id: typedSession.user.id, // Pass the Supabase auth user ID
              email: typedSession.user.email,
              display_name: typedSession.user.user_metadata?.display_name || typedSession.user.email?.split('@')[0],
              avatar_url: typedSession.user.user_metadata?.avatar_url
            })
            setUserSynced(true)
          
          // Check if there's an anonymous session to migrate (only once)
          const anonymousSessionId = localStorage.getItem('anonymous_session_id')
          if (anonymousSessionId && !migrationAttempted) {
            setMigrationAttempted(true)
            try {
              console.log('🔄 Migrating anonymous session to authenticated user...')
              await sessionApi.migrateSession(anonymousSessionId, typedSession.user.id)
              console.log('✅ Anonymous session migrated successfully')
              
              // Clear the anonymous session from localStorage
              localStorage.removeItem('anonymous_session_id')
              localStorage.removeItem('anonymous_project_id')
              localStorage.removeItem('anonymous_session_expires_at')
            } catch (migrationError) {
              console.warn('⚠️ Failed to migrate anonymous session:', migrationError)
              // Reset flag on failure so it can be retried
              setMigrationAttempted(false)
            }
          }
        } catch (backendError) {
          console.warn('⚠️ Failed to sync user to backend on auth state change:', backendError)
        }
        }
        
        setUser(convertSupabaseUser(typedSession.user))
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
      
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [convertSupabaseUser, migrationAttempted, userSynced])

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const { data, error } = await auth.signIn(email, password)
      
      if (error) {
        throw new Error(error.message)
      }
      
      if (data.user) {
        // Ensure user exists in backend
        try {
          const { sessionApi } = await import('./api')
          await sessionApi.createUser({
            user_id: data.user.id, // Pass the Supabase auth user ID
            email: data.user.email,
            display_name: data.user.user_metadata?.display_name || data.user.email?.split('@')[0],
            avatar_url: data.user.user_metadata?.avatar_url
          })
          
          // Check if there's an anonymous session to migrate (only once)
          const anonymousSessionId = localStorage.getItem('anonymous_session_id')
          if (anonymousSessionId && !migrationAttempted) {
            setMigrationAttempted(true)
            try {
              console.log('🔄 Migrating anonymous session to authenticated user...')
              await sessionApi.migrateSession(anonymousSessionId, data.user.id)
              console.log('✅ Anonymous session migrated successfully')
              
              // Clear the anonymous session from localStorage
              localStorage.removeItem('anonymous_session_id')
              localStorage.removeItem('anonymous_project_id')
              localStorage.removeItem('anonymous_session_expires_at')
            } catch (migrationError) {
              console.warn('⚠️ Failed to migrate anonymous session:', migrationError)
              setMigrationAttempted(false)
            }
          }
        } catch (backendError) {
          console.warn('⚠️ Failed to sync user to backend:', backendError)
          // Don't throw here - the user can still log in
          // We'll retry user sync when they try to use session features
        }
        
        setUser(convertSupabaseUser(data.user))
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [convertSupabaseUser, migrationAttempted])

  const signup = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      setIsLoading(true)
      const response = await auth.signUp(email, password, displayName)
      
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      // If user was created successfully, also create them in the backend
      if (response.data.user) {
        try {
          const { sessionApi } = await import('./api')
          await sessionApi.createUser({
            user_id: response.data.user.id, // Pass the Supabase auth user ID
            email: response.data.user.email,
            display_name: displayName,
            avatar_url: response.data.user.user_metadata?.avatar_url
          })
          console.log('✅ User created in backend successfully')
          
          // Check if there's an anonymous session to migrate (only once)
          const anonymousSessionId = localStorage.getItem('anonymous_session_id')
          if (anonymousSessionId && !migrationAttempted) {
            setMigrationAttempted(true)
            try {
              console.log('🔄 Migrating anonymous session to new authenticated user...')
              await sessionApi.migrateSession(anonymousSessionId, response.data.user.id)
              console.log('✅ Anonymous session migrated successfully')
              
              // Clear the anonymous session from localStorage
              localStorage.removeItem('anonymous_session_id')
              localStorage.removeItem('anonymous_project_id')
              localStorage.removeItem('anonymous_session_expires_at')
            } catch (migrationError) {
              console.warn('⚠️ Failed to migrate anonymous session:', migrationError)
              setMigrationAttempted(false)
            }
          }
        } catch (backendError) {
          console.warn('⚠️ Failed to create user in backend:', backendError)
          // Don't throw here - the user was created in Supabase auth, which is the main thing
          // The user can still use the app, and we'll try to sync them later
        }
      }
      
      // Don't set user immediately on signup - they need to confirm email first
      // User will be set when they click the email confirmation link
      
      return response
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [migrationAttempted])

  const logout = useCallback(async () => {
    try {
      setIsLoading(true)
      const { error } = await auth.signOut()
      
      if (error) {
        throw new Error(error.message)
      }
      
      // Clear all localStorage data
      localStorage.removeItem('user')
      localStorage.removeItem('chat_session')
      localStorage.removeItem('anonymous_session_id')
      localStorage.removeItem('anonymous_project_id')
      localStorage.removeItem('anonymous_session_expires_at')
      
      // Reset user state
      setUser(null)
      
      // Reset migration flags
      setMigrationAttempted(false)
      setUserSynced(false)
    } catch (error) {
      console.error('Logout error:', error)
      // Even if logout fails, clear localStorage and reset state
      localStorage.removeItem('user')
      localStorage.removeItem('chat_session')
      localStorage.removeItem('anonymous_session_id')
      localStorage.removeItem('anonymous_project_id')
      localStorage.removeItem('anonymous_session_expires_at')
      setUser(null)
      setMigrationAttempted(false)
      setUserSynced(false)
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
    signup,
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
