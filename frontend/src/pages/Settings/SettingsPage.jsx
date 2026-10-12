import { useEffect, useState } from 'react'
import { FaCheck, FaLock, FaUser } from 'react-icons/fa6'
import { useAuth } from '../../context/useAuth'
import { settingsApi } from '../../api/settings'
import { apiError } from '../../api/client'

function SettingsPage() {
  const { user } = useAuth()
  const [llm, setLlm] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { settingsApi.getLlm().then(setLlm).catch((err) => setError(apiError(err))) }, [])

  async function saveKey(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const result = await settingsApi.setGoogleKey(apiKey)
      setLlm(result)
      setApiKey('')
      setNotice('Google AI key updated for this server session.')
    } catch (err) { setError(apiError(err)) } finally { setSaving(false) }
  }

  return (
    <div className="dashboard-page">
      <div className="page-title-row"><div><p className="dashboard-eyebrow">YOUR ACCOUNT</p><h1>Settings.</h1><p>Manage your profile and the AI connection.</p></div></div>
      {error && <p className="dashboard-error">{error}</p>}{notice && <p className="dashboard-success"><FaCheck /> {notice}</p>}
      <section className="settings-card"><div className="settings-card-heading"><span><FaUser /></span><div><p className="dashboard-eyebrow">PROFILE</p><h2>Account details</h2></div></div><dl className="account-detail-list"><div><dt>Name</dt><dd>{user?.name}</dd></div><div><dt>Email</dt><dd>{user?.email}</dd></div><div><dt>Access</dt><dd>{user?.role === 'admin' ? 'Administrator' : 'Member'}</dd></div></dl></section>
      <section className="settings-card"><div className="settings-card-heading"><span><FaLock /></span><div><p className="dashboard-eyebrow">MODEL CONNECTION</p><h2>Google AI</h2></div><span className={`llm-status ${llm?.configured ? 'ready' : ''}`}><i />{llm?.configured ? 'Connected' : 'Not connected'}</span></div><p className="settings-helper">Model: {llm?.model || 'Checking connection…'}. The API key stays on the backend and is not displayed here.</p>{user?.role === 'admin' ? <form className="settings-key-form" onSubmit={saveKey}><label htmlFor="settings-google-key">Replace Google AI API key</label><div><input id="settings-google-key" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} autoComplete="off" required placeholder="Paste a new key"/><button className="dashboard-primary-link" disabled={!apiKey || saving}>{saving ? 'Saving…' : 'Save key'}</button></div><small>This backend stores the key in memory. It resets from `GOOGLE_API_KEY` when the server restarts.</small></form> : <p className="settings-helper">Only an administrator can change the shared AI connection.</p>}</section>
    </div>
  )
}

export default SettingsPage
