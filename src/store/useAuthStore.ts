'use client'

import { create } from 'zustand'
import { AuthUser, UserRole } from '@/types/auth'

export type { AuthUser }

interface AuthState {
  user: AuthUser | null
  role: UserRole | null
  token: string | null
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  initializeAuth: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  role: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        set({ isLoading: false, error: data.error || 'Login failed' })
        return
      }

      set({
        user: data.user,
        role: data.user.role,
        token: data.token,
        isLoading: false,
        error: null,
      })
    } catch {
      set({ isLoading: false, error: 'Network error. Please try again.' })
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      set({ user: null, role: null, token: null, error: null })
    }
  },

  initializeAuth: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        set({
          user: data.user,
          role: data.user.role,
          token: data.token,
          isLoading: false,
        })
      } else {
        set({ user: null, role: null, token: null, isLoading: false })
      }
    } catch {
      set({ user: null, role: null, token: null, isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
