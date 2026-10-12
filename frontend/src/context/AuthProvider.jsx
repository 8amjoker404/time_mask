import { useCallback, useEffect, useMemo, useState } from 'react'
import { authApi } from '../api/auth'
import AuthContext from './auth-context'
import { notifyToast } from '../api/client'

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(window.localStorage.getItem('time-mask-token')))

  useEffect(() => {
    let active = true
    const expire = () => {
      if (!active) return
      setUser(null)
      setLoading(false)
    }
    window.addEventListener('time-mask:auth-expired', expire)
    if (!window.localStorage.getItem('time-mask-token')) {
      return () => { active = false; window.removeEventListener('time-mask:auth-expired', expire) }
    }
    authApi.me().then(({ user: currentUser }) => {
      if (active) setUser(currentUser)
    }).catch(() => {
      if (active) window.localStorage.removeItem('time-mask-token')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false; window.removeEventListener('time-mask:auth-expired', expire) }
  }, [])

  const establishSession = useCallback(async (request) => {
    const result = await request()
    window.localStorage.setItem('time-mask-token', result.token)
    setUser(result.user)
    notifyToast(`Welcome, ${result.user.name}.`)
    return result.user
  }, [])
  const login = useCallback((credentials) => establishSession(() => authApi.login(credentials)), [establishSession])
  const register = useCallback((details) => establishSession(() => authApi.register(details)), [establishSession])
  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* Discard the local session even when offline. */ }
    window.localStorage.removeItem('time-mask-token')
    setUser(null)
    notifyToast('You have signed out.')
  }, [])

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
