import axios from 'axios'
import { useAuthStore } from '../../features/auth/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// TODO(auth): reemplazar por el token real de la sesión cuando exista el login
// Por ahora, en desarrollo, intentamos usar una variable de entorno o un token harcodeado temporal si es necesario
const DEV_TOKEN = import.meta.env.VITE_DEV_JWT || ''
if (import.meta.env.DEV && DEV_TOKEN) {
  console.warn('⚠️ Usando token temporal de desarrollo para VITE_DEV_JWT')
}

api.interceptors.request.use((config) => {
  // Cuando llegue el login real, esto usará el token del store
  let token = useAuthStore.getState().accessToken

  // TODO(auth): fallback temporal
  if (!token && DEV_TOKEN) {
    token = DEV_TOKEN
  }

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // Auto refresh logic (preparado para el auth real)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refreshToken = await window.electronAPI.store.get('refreshToken' as any)
        if (!refreshToken) throw new Error('No refresh token')
        
        const res = await axios.post(`${api.defaults.baseURL}/auth/refresh/`, { refresh: refreshToken })
        const newToken = res.data.access
        
        await useAuthStore.getState().setToken(newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        
        return axios(originalRequest)
      } catch (e) {
        useAuthStore.getState().logout()
        return Promise.reject(e)
      }
    }
    
    return Promise.reject(error)
  }
)
