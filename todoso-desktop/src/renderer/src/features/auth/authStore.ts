import { create } from 'zustand'

interface AuthState {
  isAuthenticated: boolean
  isInitialized: boolean
  accessToken: string | null
  setToken: (token: string) => void
  logout: () => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isInitialized: false,
  accessToken: null,

  setToken: async (token: string) => {
    // In a real app we might securely store it using Keytar or just electron-store for this MVP
    await window.electronAPI.store.set('accessToken' as any, token)
    set({ isAuthenticated: true, accessToken: token })
  },

  logout: async () => {
    await window.electronAPI.store.delete('accessToken' as any)
    await window.electronAPI.store.delete('refreshToken' as any)
    set({ isAuthenticated: false, accessToken: null })
  },

  initialize: async () => {
    const token = await window.electronAPI.store.get('accessToken' as any)
    if (token && typeof token === 'string') {
      set({ isAuthenticated: true, accessToken: token, isInitialized: true })
    } else {
      set({ isAuthenticated: false, accessToken: null, isInitialized: true })
    }
  }
}))

// Auto initialize
useAuthStore.getState().initialize()
