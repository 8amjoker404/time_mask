import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

function RequireAdmin() {
  const { user, loading } = useAuth()
  if (loading) return <main className="auth-loading">Checking administrator access…</main>
  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/dashboard" replace />
}

export default RequireAdmin
