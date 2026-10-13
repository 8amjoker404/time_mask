import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4001',
  headers: { 'Content-Type': 'application/json' },
})

export function notifyToast(message, type = 'success') {
  window.dispatchEvent(new CustomEvent('time-mask:toast', { detail: { type, message } }))
}

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('time-mask-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.config?.suppressErrorToast) return Promise.reject(error)
    if (error.response?.status === 401) {
      window.localStorage.removeItem('time-mask-token')
      window.dispatchEvent(new Event('time-mask:auth-expired'))
      const loginFailure = error.config?.url?.includes('/api/auth/login')
      notifyToast(loginFailure ? (error.response?.data?.error || 'Sign in failed.') : 'Your session has expired. Please sign in again.', 'error')
    } else {
      const message = error.response?.data?.error || (error.request ? 'Could not reach the server. Check your connection and try again.' : error.message)
      notifyToast(message, 'error')
    }
    return Promise.reject(error)
  },
)

export function apiError(error) {
  return error.response?.data?.error || error.message || 'Something went wrong.'
}

export default api
