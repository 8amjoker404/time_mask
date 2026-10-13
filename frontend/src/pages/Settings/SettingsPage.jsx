import { useEffect, useState } from 'react'
import { FaLock, FaUser } from 'react-icons/fa6'
import { useAuth } from '../../context/useAuth'
import { settingsApi } from '../../api/settings'
import { apiError, notifyToast } from '../../api/client'

function SettingsPage() {
  const { user } = useAuth()
  const [llm, setLlm] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [provider, setProvider] = useState('google')
  const [model, setModel] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    settingsApi.getLlm().then((settings) => {
      setLlm(settings)
      setProvider(settings.provider)
      setModel(settings.model)
    }).catch((err) => setError(apiError(err)))
  }, [])

  function changeProvider(nextProvider) {
    setProvider(nextProvider)
    setModel(llm?.models?.[nextProvider] || (nextProvider === 'openai' ? 'gpt-4o-mini' : 'gemini-3.8-flash'))
    setApiKey('')
  }

  async function saveLlmSettings(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const result = await settingsApi.updateLlm({ provider, model, apiKey })
      setLlm(result)
      setApiKey('')
      notifyToast(`${provider === 'openai' ? 'OpenAI' : 'Google AI'} settings updated for this server session.`)
    } catch (err) { setError(apiError(err)) } finally { setSaving(false) }
  }

  return (
    <div className="dashboard-page">
      <div className="page-title-row"><div><p className="dashboard-eyebrow">YOUR ACCOUNT</p><h1>Settings.</h1><p>Manage your profile and the AI connection.</p></div></div>
      {error && <p className="dashboard-error">{error}</p>}
      <section className="settings-card"><div className="settings-card-heading"><span><FaUser /></span><div><p className="dashboard-eyebrow">PROFILE</p><h2>Account details</h2></div></div><dl className="account-detail-list"><div><dt>Name</dt><dd>{user?.name}</dd></div><div><dt>Nickname</dt><dd>{user?.nickname || 'Not set'}</dd></div><div><dt>Age</dt><dd>{user?.age ?? 'Not shared'}</dd></div><div><dt>Gender</dt><dd>{user?.gender?.replaceAll('_', ' ') || 'Not shared'}</dd></div><div><dt>Email</dt><dd>{user?.email}</dd></div><div><dt>Access</dt><dd>{user?.role === 'admin' ? 'Administrator' : 'Member'}</dd></div></dl></section>
      <section className="settings-card"><div className="settings-card-heading"><span><FaLock /></span><div><p className="dashboard-eyebrow">MODEL CONNECTION</p><h2>AI provider</h2></div><span className={`llm-status ${llm?.configured ? 'ready' : ''}`}><i />{llm?.configured ? 'Connected' : 'API key needed'}</span></div><p className="settings-helper">Active provider: {llm?.provider === 'openai' ? 'OpenAI' : 'Google AI'} · Model: {llm?.model || 'Loading…'}. API keys stay on the backend.</p>{llm?.provider === 'google' && llm?.fallbackModels?.length > 0 && <p className="settings-helper">Google fallback models: {llm.fallbackModels.join(', ')}. Temporary capacity errors are retried automatically.</p>}{user?.role === 'admin' ? <form className="settings-key-form" onSubmit={saveLlmSettings}><label htmlFor="settings-provider">Provider</label><select id="settings-provider" value={provider} onChange={(event) => changeProvider(event.target.value)}><option value="google">Google Gemini</option><option value="openai">OpenAI</option></select><label htmlFor="settings-model">Model name</label><input id="settings-model" type="text" value={model} onChange={(event) => setModel(event.target.value)} required maxLength={120} placeholder={provider === 'openai' ? 'gpt-4o-mini' : 'gemini-3.8-flash'}/><label htmlFor="settings-api-key">{provider === 'openai' ? 'OpenAI' : 'Google AI'} API key <span>(leave blank to keep the saved key)</span></label><div><input id="settings-api-key" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} autoComplete="off" placeholder="Paste a key to replace it"/><button className="dashboard-primary-link" disabled={!model.trim() || saving}>{saving ? 'Saving…' : 'Save AI settings'}</button></div><small>Provider, model, and any replacement API key are stored in backend memory until the server restarts. Defaults are read from the backend environment file.</small></form> : <p className="settings-helper">Only an administrator can change the shared AI provider, model, or API key.</p>}</section>
    </div>
  )
}

export default SettingsPage
