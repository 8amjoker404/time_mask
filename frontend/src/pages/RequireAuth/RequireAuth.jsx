import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <main className="auth-loading">Opening your place in the salon…</main>
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

export default RequireAuth
