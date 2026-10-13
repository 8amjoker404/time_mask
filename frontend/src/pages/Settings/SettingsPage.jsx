import { useEffect, useState } from 'react'
import { FaLock, FaUser } from 'react-icons/fa6'
import { useAuth } from '../../context/useAuth'
import { settingsApi } from '../../api/settings'
import { apiError, notifyToast } from '../../api/client'

function SettingsPage() {
  const { user, updateProfile } = useAuth()
  const [llm, setLlm] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [provider, setProvider] = useState('google')
  const [model, setModel] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profile, setProfile] = useState({ name: user?.name || '', nickname: user?.nickname || '', age: user?.age ?? '', gender: user?.gender || '' })

  useEffect(() => {
    setProfile({ name: user?.name || '', nickname: user?.nickname || '', age: user?.age ?? '', gender: user?.gender || '' })
  }, [user])

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

  async function saveProfile(event) {
    event.preventDefault()
    setProfileSaving(true)
    setError('')
    try {
      await updateProfile({ ...profile, age: profile.age === '' ? null : Number(profile.age), gender: profile.gender || null })
      setEditingProfile(false)
    } catch (err) { setError(apiError(err)) } finally { setProfileSaving(false) }
  }

  return (
    <div className="dashboard-page">
      <div className="page-title-row"><div><p className="dashboard-eyebrow">YOUR ACCOUNT</p><h1>Settings.</h1><p>Manage your profile and account details.</p></div></div>
      {error && <p className="dashboard-error">{error}</p>}
      <section className="settings-card"><div className="settings-card-heading"><span><FaUser /></span><div><p className="dashboard-eyebrow">PROFILE</p><h2>Account details</h2></div>{!editingProfile && <button type="button" className="dashboard-outline-link profile-edit-trigger" onClick={() => setEditingProfile(true)}>Edit profile</button>}</div>{editingProfile ? <form className="settings-key-form profile-edit-form" onSubmit={saveProfile}><label htmlFor="profile-name">Name</label><input id="profile-name" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} autoComplete="name" maxLength={100} required/><label htmlFor="profile-nickname">Nickname or username</label><input id="profile-nickname" value={profile.nickname} onChange={(event) => setProfile({ ...profile, nickname: event.target.value })} autoComplete="username" maxLength={40} placeholder="Optional; 3–40 characters"/><label htmlFor="profile-age">Age</label><input id="profile-age" type="number" value={profile.age} onChange={(event) => setProfile({ ...profile, age: event.target.value })} min="13" max="120" step="1" placeholder="Optional"/><label htmlFor="profile-gender">Gender</label><select id="profile-gender" value={profile.gender} onChange={(event) => setProfile({ ...profile, gender: event.target.value })}><option value="">Prefer not to share</option><option value="female">Female</option><option value="male">Male</option><option value="non_binary">Non-binary</option><option value="prefer_not_to_say">Prefer not to say</option></select><label>Email</label><p className="settings-helper profile-readonly-value">{user?.email}</p><div><button className="dashboard-primary-link" disabled={profileSaving}>{profileSaving ? 'Saving…' : 'Save profile'}</button><button type="button" className="dashboard-outline-link" disabled={profileSaving} onClick={() => { setProfile({ name: user?.name || '', nickname: user?.nickname || '', age: user?.age ?? '', gender: user?.gender || '' }); setEditingProfile(false) }}>Cancel</button></div></form> : <dl className="account-detail-list"><div><dt>Name</dt><dd>{user?.name}</dd></div><div><dt>Nickname</dt><dd>{user?.nickname || 'Not set'}</dd></div><div><dt>Age</dt><dd>{user?.age ?? 'Not shared'}</dd></div><div><dt>Gender</dt><dd>{user?.gender?.replaceAll('_', ' ') || 'Not shared'}</dd></div><div><dt>Email</dt><dd>{user?.email}</dd></div></dl>}</section>
      <section className="settings-card"><div className="settings-card-heading"><span><FaLock /></span><div><p className="dashboard-eyebrow">CONVERSATION ENGINE</p><h2>LLM</h2></div>{user?.role === 'admin' && <span className={`llm-status ${llm?.configured ? 'ready' : ''}`}><i />{llm?.configured ? 'Ready' : 'Needs API key'}</span>}</div><p className="settings-helper">An LLM is an AI language model. It reads the conversation and creates natural replies in each character’s style, so chatting feels like a flowing conversation.</p>{user?.role === 'admin' && <form className="settings-key-form" onSubmit={saveLlmSettings}><label htmlFor="settings-provider">AI service</label><select id="settings-provider" value={provider} onChange={(event) => changeProvider(event.target.value)}><option value="google">Google Gemini</option><option value="openai">OpenAI</option></select><label htmlFor="settings-model">Model</label><input id="settings-model" type="text" value={model} onChange={(event) => setModel(event.target.value)} required maxLength={120} placeholder={provider === 'openai' ? 'gpt-4o-mini' : 'gemini-3.8-flash'}/><label htmlFor="settings-api-key">{provider === 'openai' ? 'OpenAI' : 'Google AI'} API key <span>(optional; leave blank to keep the current key)</span></label><div><input id="settings-api-key" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} autoComplete="off" placeholder="Enter a replacement key if needed"/><button className="dashboard-primary-link" disabled={!model.trim() || saving}>{saving ? 'Saving…' : 'Save changes'}</button></div></form>}</section>
    </div>
  )
}

export default SettingsPage
