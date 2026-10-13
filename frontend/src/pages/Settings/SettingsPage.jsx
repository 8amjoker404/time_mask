import { useEffect, useState } from 'react'
import { FaComments, FaLock, FaTrash, FaUser, FaUsers } from 'react-icons/fa6'
import { useAuth } from '../../context/useAuth'
import { settingsApi } from '../../api/settings'
import { conversationsApi } from '../../api/conversations'
import { groupsApi } from '../../api/groups'
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
  const [history, setHistory] = useState({ conversations: [], groups: [] })
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyAction, setHistoryAction] = useState(null)
  const [historySaving, setHistorySaving] = useState(false)

  async function loadHistory() {
    try {
      const [conversations, groups] = await Promise.all([conversationsApi.list(), groupsApi.list()])
      setHistory({ conversations, groups })
    } catch (err) { setError(apiError(err)) } finally { setHistoryLoading(false) }
  }

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

  useEffect(() => { loadHistory() }, [])

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

  async function performHistoryAction() {
    if (!historyAction) return
    setHistorySaving(true)
    setError('')
    try {
      if (historyAction.type === 'reset') {
        await conversationsApi.clearHistory()
        notifyToast('Your chat history and twin interviews have been cleared.')
      } else if (historyAction.type === 'conversation') {
        await conversationsApi.remove(historyAction.id)
        notifyToast(`Your conversation with ${historyAction.name} was deleted.`)
      } else {
        await groupsApi.remove(historyAction.id)
        notifyToast(`${historyAction.name} group was deleted.`)
      }
      setHistoryAction(null)
      await loadHistory()
    } catch (err) { setError(apiError(err)) } finally { setHistorySaving(false) }
  }

  return (
    <div className="dashboard-page">
      <div className="page-title-row"><div><p className="dashboard-eyebrow">YOUR ACCOUNT</p><h1>Settings.</h1><p>Manage your profile and account details.</p></div></div>
      {error && <p className="dashboard-error">{error}</p>}
      <section className="settings-card"><div className="settings-card-heading"><span><FaUser /></span><div><p className="dashboard-eyebrow">PROFILE</p><h2>Account details</h2></div>{!editingProfile && <button type="button" className="dashboard-outline-link profile-edit-trigger" onClick={() => setEditingProfile(true)}>Edit profile</button>}</div>{editingProfile ? <form className="settings-key-form profile-edit-form" onSubmit={saveProfile}><label htmlFor="profile-name">Name</label><input id="profile-name" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} autoComplete="name" maxLength={100} required/><label htmlFor="profile-nickname">Nickname or username</label><input id="profile-nickname" value={profile.nickname} onChange={(event) => setProfile({ ...profile, nickname: event.target.value })} autoComplete="username" maxLength={40} placeholder="Optional; 3–40 characters"/><label htmlFor="profile-age">Age</label><input id="profile-age" type="number" value={profile.age} onChange={(event) => setProfile({ ...profile, age: event.target.value })} min="13" max="120" step="1" placeholder="Optional"/><label htmlFor="profile-gender">Gender</label><select id="profile-gender" value={profile.gender} onChange={(event) => setProfile({ ...profile, gender: event.target.value })}><option value="">Prefer not to share</option><option value="female">Female</option><option value="male">Male</option><option value="non_binary">Non-binary</option><option value="prefer_not_to_say">Prefer not to say</option></select><label>Email</label><p className="settings-helper profile-readonly-value">{user?.email}</p><div><button className="dashboard-primary-link" disabled={profileSaving}>{profileSaving ? 'Saving…' : 'Save profile'}</button><button type="button" className="dashboard-outline-link" disabled={profileSaving} onClick={() => { setProfile({ name: user?.name || '', nickname: user?.nickname || '', age: user?.age ?? '', gender: user?.gender || '' }); setEditingProfile(false) }}>Cancel</button></div></form> : <dl className="account-detail-list"><div><dt>Name</dt><dd>{user?.name}</dd></div><div><dt>Nickname</dt><dd>{user?.nickname || 'Not set'}</dd></div><div><dt>Age</dt><dd>{user?.age ?? 'Not shared'}</dd></div><div><dt>Gender</dt><dd>{user?.gender?.replaceAll('_', ' ') || 'Not shared'}</dd></div><div><dt>Email</dt><dd>{user?.email}</dd></div></dl>}</section>
      <section className="settings-card settings-history-card"><div className="settings-card-heading"><span><FaComments /></span><div><p className="dashboard-eyebrow">YOUR DATA</p><h2>Conversations</h2></div></div><p className="settings-helper">Delete an individual chat or group, or clear your complete chat history. Clearing history also resets twin interview answers while keeping your account, twins, and group rooms.</p><div className="settings-history-columns"><div><h3>Character chats</h3>{historyLoading ? <p className="settings-history-empty">Loading conversations…</p> : history.conversations.length ? history.conversations.map((item) => <div className="settings-history-row" key={item.id}><span><FaComments /><strong>{item.maskName}</strong></span><button type="button" onClick={() => setHistoryAction({ type: 'conversation', id: item.id, name: item.maskName })} aria-label={`Delete chat with ${item.maskName}`}><FaTrash /> Delete</button></div>) : <p className="settings-history-empty">No character chats yet.</p>}</div><div><h3>Group chats</h3>{historyLoading ? <p className="settings-history-empty">Loading groups…</p> : history.groups.length ? history.groups.map((item) => <div className="settings-history-row" key={item.id}><span><FaUsers /><strong>{item.name}</strong></span><button type="button" onClick={() => setHistoryAction({ type: 'group', id: item.id, name: item.name })} aria-label={`Delete ${item.name} group`}><FaTrash /> Delete</button></div>) : <p className="settings-history-empty">No groups yet.</p>}</div></div><button type="button" className="settings-reset-history" onClick={() => setHistoryAction({ type: 'reset' })}><FaTrash /> Reset all chat history</button></section>
      <section className="settings-card"><div className="settings-card-heading"><span><FaLock /></span><div><p className="dashboard-eyebrow">CONVERSATION ENGINE</p><h2>LLM</h2></div>{user?.role === 'admin' && <span className={`llm-status ${llm?.configured ? 'ready' : ''}`}><i />{llm?.configured ? 'Ready' : 'Needs API key'}</span>}</div><p className="settings-helper">An LLM is an AI language model. It reads the conversation and creates natural replies in each character’s style, so chatting feels like a flowing conversation.</p>{user?.role === 'admin' && <form className="settings-key-form" onSubmit={saveLlmSettings}><label htmlFor="settings-provider">AI service</label><select id="settings-provider" value={provider} onChange={(event) => changeProvider(event.target.value)}><option value="google">Google Gemini</option><option value="openai">OpenAI</option></select><label htmlFor="settings-model">Model</label><input id="settings-model" type="text" value={model} onChange={(event) => setModel(event.target.value)} required maxLength={120} placeholder={provider === 'openai' ? 'gpt-4o-mini' : 'gemini-3.8-flash'}/><label htmlFor="settings-api-key">{provider === 'openai' ? 'OpenAI' : 'Google AI'} API key <span>(optional; leave blank to keep the current key)</span></label><div><input id="settings-api-key" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} autoComplete="off" placeholder="Enter a replacement key if needed"/><button className="dashboard-primary-link" disabled={!model.trim() || saving}>{saving ? 'Saving…' : 'Save changes'}</button></div></form>}</section>
      {historyAction && <div className="dashboard-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !historySaving) setHistoryAction(null) }}><section className="dashboard-modal settings-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="settings-confirm-title"><button className="dashboard-modal-close" type="button" onClick={() => setHistoryAction(null)} disabled={historySaving}>×</button><p className="dashboard-eyebrow">CONFIRM ACTION</p><h2 id="settings-confirm-title">{historyAction.type === 'reset' ? 'Reset all chat history?' : `Delete ${historyAction.name}?`}</h2><p>{historyAction.type === 'reset' ? 'This permanently clears all character chat messages, every group chat message, and twin interview answers across your account. Your profile, saved twins, and group rooms will stay.' : historyAction.type === 'conversation' ? 'This permanently removes your full chat history with this character, including earlier messages.' : 'This permanently deletes the group and all of its messages.'}</p><div className="settings-confirm-actions"><button type="button" className="dashboard-outline-link" onClick={() => setHistoryAction(null)} disabled={historySaving}>Cancel</button><button type="button" className="settings-reset-history" onClick={performHistoryAction} disabled={historySaving}>{historySaving ? 'Deleting…' : historyAction.type === 'reset' ? 'Reset history' : 'Delete'}</button></div></section></div>}
    </div>
  )
}

export default SettingsPage
