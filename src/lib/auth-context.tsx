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
  changePassword: (newPassword: string) => Promise<void>
  changeEmail: (newEmail: string) => Promise<void>
  deleteAccount: () => Promise<void>
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

  // Note: We no longer store user data in localStorage - Supabase is the source of truth
  // User data is always fetched from the current Supabase session

  // Sync user to backend
  // IMPORTANT: Backend database is the source of truth for user identity
  // If a user with the same email exists in backend, we use that user_id instead
  const syncUserToBackend = useCallback(async (supabaseUser: SupabaseUser) => {
    try {
      const { sessionApi } = await import('./api')
      const response = await sessionApi.createUser({
        user_id: supabaseUser.id, // Supabase Auth user ID (may be overridden by backend)
        email: supabaseUser.email,
        display_name: supabaseUser.user_metadata?.display_name || supabaseUser.email?.split('@')[0],
        avatar_url: supabaseUser.user_metadata?.avatar_url
      }) as any
      
      // If backend returns a different user_id (because user exists by email), 
      // we need to update our local user state to use the backend user_id
      if (response.backend_user_id && response.backend_user_id !== supabaseUser.id) {
        console.warn('⚠️ [AUTH] Backend found existing user with different user_id')
        console.warn(`   Supabase Auth user_id: ${supabaseUser.id}`)
        console.warn(`   Backend user_id: ${response.backend_user_id}`)
        console.warn('   Using backend user_id as source of truth')
        
        // Update the user state with the backend user_id
        setUser({
          user_id: response.backend_user_id,
          email: response.user?.email || supabaseUser.email,
          display_name: response.user?.display_name,
          avatar_url: response.user?.avatar_url,
          created_at: response.user?.created_at,
          updated_at: response.user?.updated_at
        })
        
        // Store the backend user_id in a way that getUserHeaders can use it
        // We'll need to override the Supabase session user_id for API calls
        if (typeof window !== 'undefined') {
          localStorage.setItem('backend_user_id', response.backend_user_id)
        }
      }
      
      return true
    } catch (error) {
      console.error('Failed to sync user to backend:', error)
      return false
    }
  }, [])

  // Check for existing user on mount and listen to auth changes
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get current session
        const { session } = await auth.getCurrentSession()
        if (session?.user) {
          // Always sync user to backend on app initialization if session exists
          // syncUserToBackend will update user state if backend returns different user_id
          await syncUserToBackend(session.user)
          // Only set user from Supabase if backend didn't override it
          const backendUserId = typeof window !== 'undefined' ? localStorage.getItem('backend_user_id') : null
          if (!backendUserId) {
            const user = convertSupabaseUser(session.user)
            setUser(user)
          }
          // User is set (either by syncUserToBackend or convertSupabaseUser), mark loading as complete
          setIsLoading(false)
        } else {
          // No session found, mark loading as complete
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        // On error, still mark loading as complete
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen to auth state changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      const typedSession = session as Session | null
      
      if (event === 'SIGNED_IN' && typedSession?.user) {
        // Always sync user to backend on sign in
        // syncUserToBackend will update user state if backend returns different user_id
        await syncUserToBackend(typedSession.user)
        // Only set user from Supabase if backend didn't override it
        const backendUserId = typeof window !== 'undefined' ? localStorage.getItem('backend_user_id') : null
        if (!backendUserId) {
          setUser(convertSupabaseUser(typedSession.user))
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserSynced(false)
        // Clear backend user_id override on logout
        if (typeof window !== 'undefined') {
          localStorage.removeItem('backend_user_id')
        }
      }
      
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [convertSupabaseUser, syncUserToBackend])

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const { data, error } = await auth.signIn(email, password)
      
      if (error) {
        throw new Error(error.message)
      }
      
      if (data.user) {
        // Always sync user to backend on login
        // syncUserToBackend will update user state if backend returns different user_id
        await syncUserToBackend(data.user)
        // Only set user from Supabase if backend didn't override it
        const backendUserId = typeof window !== 'undefined' ? localStorage.getItem('backend_user_id') : null
        if (!backendUserId) {
          setUser(convertSupabaseUser(data.user))
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [convertSupabaseUser, syncUserToBackend])

  const signup = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      setIsLoading(true)
      const response = await auth.signUp(email, password, displayName)
      
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      // If user was created successfully, also create them in the backend
      if (response.data.user) {
        // Use the sync function to ensure user exists in backend with correct ID
        await syncUserToBackend({
          ...response.data.user,
          user_metadata: {
            ...response.data.user.user_metadata,
            display_name: displayName
          }
        })
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
  }, [syncUserToBackend])

  const logout = useCallback(async () => {
    try {
      setIsLoading(true)
      const { error } = await auth.signOut()
      
      if (error) {
        throw new Error(error.message)
      }
      
      // Clear chat session (user data comes from Supabase, no need to clear)
      localStorage.removeItem('chat_session')
      
      // Reset user state
      setUser(null)
      
      // Reset migration flags
      setMigrationAttempted(false)
      setUserSynced(false)
    } catch (error) {
      console.error('Logout error:', error)
      // Even if logout fails, clear chat session and reset state
      localStorage.removeItem('chat_session')
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

  const changePassword = useCallback(async (newPassword: string) => {
    if (!user) throw new Error('Not authenticated')
    
    try {
      const { error } = await auth.updatePassword(newPassword)
      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Password change error:', error)
      throw error
    }
  }, [user])

  const changeEmail = useCallback(async (newEmail: string) => {
    if (!user) throw new Error('Not authenticated')
    
    try {
      const { error } = await auth.updateEmail(newEmail)
      if (error) {
        throw new Error(error.message)
      }
      
      // Update local state
      const updatedUser = { ...user, email: newEmail }
      setUser(updatedUser)
    } catch (error) {
      console.error('Email change error:', error)
      throw error
    }
  }, [user])

  const deleteAccount = useCallback(async () => {
    if (!user) throw new Error('Not authenticated')
    
    try {
      // Delete user from backend first
      try {
        const { sessionApi } = await import('./api')
        // Note: This would need a delete user endpoint in the backend
        // For now, we'll just sign out
      } catch (backendError) {
        console.warn('Failed to delete user from backend:', backendError)
      }
      
      // Sign out and clear all data
      await logout()
    } catch (error) {
      console.error('Account deletion error:', error)
      throw error
    }
  }, [user, logout])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    updateProfile,
    changePassword,
    changeEmail,
    deleteAccount
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
