import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4001',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('time-mask-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.localStorage.removeItem('time-mask-token')
      window.dispatchEvent(new Event('time-mask:auth-expired'))
    }
    return Promise.reject(error)
  },
)

export function apiError(error) {
  return error.response?.data?.error || error.message || 'Something went wrong.'
}

export default api
