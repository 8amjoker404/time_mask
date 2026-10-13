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
  const [nickname, setNickname] = useState('')
  const [gender, setGender] = useState('')
  const [age, setAge] = useState('')
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
      if (mode === 'register') await register({ name, nickname, gender, age: age || null, email, password })
      else await login({ identifier: email, password })
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
    } catch (err) { setError(apiError(err)) } finally { setBusy(false) }
  }

  return (
    <main className="auth-page">
      <Link className="dashboard-brand" to="/"><span className="brand-mark"><span /></span><span>TIME <i>MASK</i></span></Link>
      <section className="auth-card"><p className="dashboard-eyebrow">YOUR PLACE IN THE SALON</p><h1>{mode === 'register' ? 'Create your account.' : 'Welcome back.'}</h1><p className="auth-card-intro">{mode === 'register' ? 'Save your favorite historical voices and keep your conversations together.' : 'Sign in to return to your conversations across time.'}</p>
        {error && <p className="dashboard-error">{error}</p>}
        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && <>
            <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required maxLength={100}/></label>
            <label>Nickname or username <span className="auth-field-note">Optional</span><input value={nickname} onChange={(event) => setNickname(event.target.value)} autoComplete="nickname" maxLength={40} placeholder="What should we call you?"/></label>
            <div className="auth-form-row">
              <label>Age <span className="auth-field-note">Optional</span><input type="number" value={age} onChange={(event) => setAge(event.target.value)} min="13" max="120" step="1" inputMode="numeric" placeholder="13+"/></label>
              <label>Gender <span className="auth-field-note">Optional</span><select value={gender} onChange={(event) => setGender(event.target.value)}><option value="">Prefer not to share</option><option value="female">Female</option><option value="male">Male</option><option value="non_binary">Non-binary</option><option value="prefer_not_to_say">Prefer not to say</option></select></label>
            </div>
            <p className="auth-privacy-note">These details help personalize your experience. You can leave any of them blank.</p>
          </>}
          <label>{mode === 'register' ? 'Email' : 'Email or username'}<input type={mode === 'register' ? 'email' : 'text'} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete={mode === 'register' ? 'email' : 'username'} placeholder={mode === 'register' ? undefined : 'Email or username'} required/></label>
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
