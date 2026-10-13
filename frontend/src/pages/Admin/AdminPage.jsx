import { useEffect, useState } from 'react'
import { FaArrowRight, FaPen, FaPlus, FaTrash } from 'react-icons/fa6'
import { adminApi } from '../../api/admin'
import { notifyToast } from '../../api/client'
import { masksApi } from '../../api/masks'

const emptyCharacter = { name: '', era: '', profession: '', summary: '', avatarUrl: '', characterSpec: '' }

function AdminPage() {
  const [users, setUsers] = useState([])
  const [characters, setCharacters] = useState([])
  const [character, setCharacter] = useState(emptyCharacter)
  const [editingId, setEditingId] = useState(null)
  const [passwords, setPasswords] = useState({})
  const [confirmation, setConfirmation] = useState(null)
  const [busy, setBusy] = useState(false)

  async function refresh() {
    const [allUsers, allCharacters] = await Promise.all([adminApi.users(), masksApi.list()])
    setUsers(allUsers)
    setCharacters(allCharacters)
  }

  useEffect(() => {
    let active = true
    Promise.all([adminApi.users(), masksApi.list()]).then(([allUsers, allCharacters]) => {
      if (!active) return
      setUsers(allUsers)
      setCharacters(allCharacters)
    }).catch(() => {})
    return () => { active = false }
  }, [])

  async function saveCharacter(event) {
    event.preventDefault()
    setBusy(true)
    try {
      if (editingId) await masksApi.update(editingId, character)
      else await masksApi.create(character)
      setCharacter(emptyCharacter); setEditingId(null)
      await refresh(); notifyToast(editingId ? 'Character updated.' : 'Character added.')
    } catch { /* The shared API layer displays the error toast. */ } finally { setBusy(false) }
  }

  function removeUser(user) {
    setConfirmation({
      title: `Delete ${user.name}?`,
      message: 'This permanently deletes the account and its associated conversations and groups.',
      confirmLabel: 'Delete user',
      action: async () => {
        try { await adminApi.deleteUser(user.id); await refresh(); notifyToast(`${user.name} was deleted.`) }
        catch { /* The shared API layer displays the error toast. */ }
      },
    })
  }

  async function setPassword(event, user) {
    event.preventDefault()
    const password = passwords[user.id] || ''
    try {
      await adminApi.setPassword(user.id, password)
      setPasswords((current) => ({ ...current, [user.id]: '' }))
      notifyToast(`Password reset for ${user.name}.`)
    } catch { /* The shared API layer displays the error toast. */ }
  }

  function removeCharacter(mask) {
    setConfirmation({
      title: `Delete ${mask.name}?`,
      message: 'This removes the character and its existing one-to-one conversations from the collection.',
      confirmLabel: 'Delete character',
      action: async () => {
        try { await masksApi.remove(mask.id); await refresh(); notifyToast(`${mask.name} was deleted.`) }
        catch { /* The shared API layer displays the error toast. */ }
      },
    })
  }

  async function confirmAction() {
    const action = confirmation?.action
    setConfirmation(null)
    await action?.()
  }

  function editCharacter(mask) {
    setEditingId(mask.id)
    setCharacter({ name: mask.name || '', era: mask.era || '', profession: mask.profession || '', summary: mask.summary || '', avatarUrl: mask.avatarUrl || '', characterSpec: mask.characterSpec || '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="dashboard-page admin-page">
      <div className="page-title-row"><div><p className="dashboard-eyebrow">TIME MASK CONTROL ROOM</p><h1>Time <em>Master.</em></h1><p>Manage accounts and historical characters.</p></div></div>

      <section className="settings-card admin-section">
        <div className="admin-section-heading"><div><p className="dashboard-eyebrow">CHARACTER LIBRARY</p><h2>{editingId ? 'Edit a character' : 'Add a character'}</h2></div><span>{characters.length} characters</span></div>
        <form className="admin-character-form" onSubmit={saveCharacter}>
          <label>Name<input value={character.name} onChange={(e) => setCharacter({ ...character, name: e.target.value })} maxLength={160} required /></label>
          <label>Historical era<input value={character.era} onChange={(e) => setCharacter({ ...character, era: e.target.value })} maxLength={160} /></label>
          <label>Profession<input value={character.profession} onChange={(e) => setCharacter({ ...character, profession: e.target.value })} maxLength={160} /></label>
          <label className="admin-field-wide">Biography<textarea value={character.summary} onChange={(e) => setCharacter({ ...character, summary: e.target.value })} maxLength={2000} rows={4} /></label>
          <label className="admin-field-wide">Portrait image URL<input type="text" value={character.avatarUrl} onChange={(e) => setCharacter({ ...character, avatarUrl: e.target.value })} maxLength={2000} placeholder="https://… or /assets/masks/portrait.png" /></label>
          {character.avatarUrl && <img className="admin-character-preview" src={character.avatarUrl} alt="Character portrait preview" />}
          <label className="admin-field-wide">Character specification<textarea value={character.characterSpec} onChange={(e) => setCharacter({ ...character, characterSpec: e.target.value })} maxLength={12000} rows={5} required /></label>
          <div className="admin-form-actions"><button className="dashboard-primary-link" disabled={busy}>{editingId ? <FaPen /> : <FaPlus />}{busy ? 'Saving…' : editingId ? 'Save changes' : 'Add character'}<FaArrowRight /></button>{editingId && <button className="dashboard-outline-link" type="button" onClick={() => { setEditingId(null); setCharacter(emptyCharacter) }}>Cancel edit</button>}</div>
        </form>
        <div className="admin-character-list">{characters.map((mask) => <article className="admin-character-row" key={mask.id}>{mask.avatarUrl && <img src={mask.avatarUrl} alt="" loading="lazy" />}<div><strong>{mask.name}</strong><small>{[mask.profession, mask.era].filter(Boolean).join(' · ') || 'History character'}</small></div><div className="admin-row-actions"><button className="dashboard-outline-link" onClick={() => editCharacter(mask)}><FaPen /> Edit</button><button className="admin-delete-button" onClick={() => removeCharacter(mask)} aria-label={`Delete ${mask.name}`}><FaTrash /></button></div></article>)}</div>
      </section>

      <section className="settings-card admin-section">
        <div className="admin-section-heading"><div><p className="dashboard-eyebrow">MEMBERS</p><h2>All users</h2></div><span>{users.length} accounts</span></div>
        <div className="admin-user-list">{users.map((user) => <article className="admin-user-row" key={user.id}><div className="admin-user-info"><strong>{user.nickname || user.name}</strong><span>{user.email}</span><small>{[user.age != null ? `${user.age} years old` : null, user.gender?.replaceAll('_', ' '), user.role, `joined ${new Date(user.created_at).toLocaleDateString()}`].filter(Boolean).join(' · ')}</small></div><form className="admin-reset-form" onSubmit={(event) => setPassword(event, user)}><input type="password" minLength={10} value={passwords[user.id] || ''} onChange={(e) => setPasswords((current) => ({ ...current, [user.id]: e.target.value }))} placeholder="Choose new password" aria-label={`New password for ${user.nickname || user.name}`} required /><button className="dashboard-outline-link" type="submit">Reset password</button></form><button className="admin-delete-button" onClick={() => removeUser(user)} aria-label={`Delete ${user.nickname || user.name}`}><FaTrash /></button></article>)}</div>
      </section>
      {confirmation && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmation(null) }}><section className="admin-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="admin-confirm-title"><p className="dashboard-eyebrow">PLEASE CONFIRM</p><h2 id="admin-confirm-title">{confirmation.title}</h2><p>{confirmation.message}</p><div><button className="dashboard-outline-link" onClick={() => setConfirmation(null)}>Cancel</button><button className="admin-confirm-delete" onClick={confirmAction}>{confirmation.confirmLabel}</button></div></section></div>}
    </div>
  )
}

export default AdminPage
