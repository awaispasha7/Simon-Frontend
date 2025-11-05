import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a safe, optional client for MVP (no envs required)
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    })
  : null as any

// Auth helper functions (no-op when Supabase is not configured)
export const auth = {
  signUp: async (email: string, password: string, displayName: string) => {
    if (!supabase) return { data: null, error: null }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `https://stories-we-tell.vercel.app/auth/callback`
      }
    })
    return { data, error }
  },

  signIn: async (email: string, password: string) => {
    if (!supabase) return { data: null, error: null }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  },

  signOut: async () => {
    if (!supabase) return { error: null }
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getCurrentUser: async () => {
    if (!supabase) return { user: null, error: null }
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  getCurrentSession: async () => {
    if (!supabase) return { session: null, error: null }
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
    if (!supabase) {
      return { data: { subscription: { unsubscribe: () => {} } } } as any
    }
    return supabase.auth.onAuthStateChange(callback)
  }
}
