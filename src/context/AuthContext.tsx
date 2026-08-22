import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

// Real authentication via Supabase: passwords are hashed and verified
// server-side, sessions are signed JWTs Supabase issues and refreshes —
// none of that logic lives in this app. This context only tracks the
// resulting session and exposes sign up/in/out.

export type AccessibilityNeed = 'vision' | 'hearing' | 'motor' | 'cognitive'

interface AuthResult {
  error?: string
}

interface AuthContextValue {
  isAuthenticated: boolean
  userEmail: string | null
  loading: boolean
  configured: boolean
  /** undefined = hasn't answered the onboarding question yet; [] = answered "none". */
  accessibilityNeeds: AccessibilityNeed[] | undefined
  /** undefined = never set — callers should treat this as the default rate (1x). */
  speechRate: number | undefined
  signUp: (email: string, password: string) => Promise<AuthResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  logout: () => Promise<void>
  savePreferences: (needs: AccessibilityNeed[], speechRate: number) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  async function signUp(email: string, password: string): Promise<AuthResult> {
    if (!supabase) return { error: 'Supabase is not configured — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.' }
    const { error } = await supabase.auth.signUp({ email, password })
    return error ? { error: error.message } : {}
  }

  async function signIn(email: string, password: string): Promise<AuthResult> {
    if (!supabase) return { error: 'Supabase is not configured — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? { error: error.message } : {}
  }

  async function logout() {
    await supabase?.auth.signOut()
  }

  async function savePreferences(needs: AccessibilityNeed[], speechRate: number) {
    if (!supabase) return
    const { data, error } = await supabase.auth.updateUser({
      data: { accessibility_needs: needs, speech_rate: speechRate },
    })
    if (!error && data.user) {
      setSession((s) => (s ? { ...s, user: data.user } : s))
    }
  }

  const rawNeeds = session?.user.user_metadata?.accessibility_needs
  const accessibilityNeeds: AccessibilityNeed[] | undefined = Array.isArray(rawNeeds) ? rawNeeds : undefined

  const rawRate = session?.user.user_metadata?.speech_rate
  const speechRate: number | undefined = typeof rawRate === 'number' ? rawRate : undefined

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!session,
        userEmail: session?.user.email ?? null,
        loading,
        configured: isSupabaseConfigured,
        accessibilityNeeds,
        speechRate,
        signUp,
        signIn,
        logout,
        savePreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
