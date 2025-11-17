import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Auth helper functions
export const auth = {
  // Sign up with email and password
  signUp: async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
        emailRedirectTo: `https://stories-we-tell.vercel.app/auth/callback`
      }
    })
    return { data, error }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Get current session
  getCurrentSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Update password
  updatePassword: async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    return { data, error }
  },

  // Update email
  updateEmail: async (newEmail: string) => {
    const { data, error } = await supabase.auth.updateUser({
      email: newEmail
    })
    return { data, error }
  },

  // Delete user account (requires admin API or user deletion endpoint)
  deleteUser: async () => {
    // Note: This requires admin privileges or a backend endpoint
    // For now, we'll use the admin API if available
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: { message: 'No user found' } }
    }
    
    // Delete user data from backend first
    try {
      const response = await fetch('/api/v1/users/me', {
        method: 'DELETE',
        headers: {
          'X-User-ID': user.id
        }
      })
      if (!response.ok) {
        console.warn('Failed to delete user from backend')
      }
    } catch (error) {
      console.warn('Error deleting user from backend:', error)
    }
    
    // Sign out (user deletion from Supabase auth requires admin API)
    const { error } = await supabase.auth.signOut()
    return { error }
  }
}
