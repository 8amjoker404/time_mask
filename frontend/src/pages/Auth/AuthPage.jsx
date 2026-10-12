import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { apiError } from '../../api/client'
import './auth.css'

function AuthPage() {
  const { user, login, register } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (mode === 'register') await register({ name, email, password })
      else await login({ email, password })
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
    } catch (err) { setError(apiError(err)) } finally { setBusy(false) }
  }

  return (
    <main className="auth-page">
      <Link className="dashboard-brand" to="/"><span className="brand-mark"><span /></span><span>TIME <i>MASK</i></span></Link>
      <section className="auth-card"><p className="dashboard-eyebrow">YOUR PLACE IN THE SALON</p><h1>{mode === 'register' ? 'Create your account.' : 'Welcome back.'}</h1><p className="auth-card-intro">{mode === 'register' ? 'Save your favorite historical voices and keep your conversations together.' : 'Sign in to return to your conversations across time.'}</p>
        {error && <p className="dashboard-error">{error}</p>}
        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && <label>Name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required maxLength={100}/></label>}
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required/></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={mode === 'register' ? 10 : undefined} required/></label>
          <button className="dashboard-primary-link" disabled={busy}>{busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'} <span>→</span></button>
        </form>
        <button className="auth-mode-toggle" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError('') }}>{mode === 'register' ? 'Already a member? Sign in' : 'New to Time Mask? Create an account'}</button>
      </section>
      <Link className="auth-back-link" to="/">Return to Time Mask</Link>
    </main>
  )
}

export default AuthPage
