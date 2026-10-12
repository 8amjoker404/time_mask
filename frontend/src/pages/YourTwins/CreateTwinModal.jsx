import { useMemo, useState } from 'react'
import { FaArrowRight } from 'react-icons/fa6'

function CreateTwinModal({ masks, existingTwinIds, busy, error, onClose, onCreate }) {
  const [mode, setMode] = useState('historical')
  const [selectedId, setSelectedId] = useState('')
  const [name, setName] = useState('My Twin')
  const [gender, setGender] = useState('unspecified')
  const availableMasks = useMemo(() => masks.filter((mask) => !existingTwinIds.has(String(mask.id))), [masks, existingTwinIds])
  const selected = availableMasks.find((mask) => String(mask.id) === selectedId)
  const canCreate = mode === 'historical' ? Boolean(selected) : Boolean(name.trim())

  function submit(event) {
    event.preventDefault()
    if (!canCreate || busy) return
    if (mode === 'historical') onCreate({ type: mode, mask: selected })
    else onCreate({ type: mode, name: name.trim(), gender })
  }

  return (
    <div className="create-twin-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}>
      <form className="create-twin-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="create-twin-title">
        <button className="dashboard-modal-close" type="button" onClick={onClose} disabled={busy} aria-label="Close">×</button>
        <p className="dashboard-eyebrow">A NEW COMPANION</p>
        <h2 id="create-twin-title">{mode === 'historical' ? 'Choose a voice for your twin.' : 'Create a twin of your own.'}</h2>
        <p className="create-twin-description">Your twin will ask a few friendly questions and learn how you like to chat. You can choose a historical personality or let your conversations shape a new companion.</p>
        <div className="create-twin-mode-switch" role="tablist" aria-label="Twin style">
          <button type="button" role="tab" aria-selected={mode === 'historical'} className={mode === 'historical' ? 'active' : ''} onClick={() => setMode('historical')}>Historical voice</button>
          <button type="button" role="tab" aria-selected={mode === 'custom'} className={mode === 'custom' ? 'active' : ''} onClick={() => setMode('custom')}>New companion</button>
        </div>
        {mode === 'historical' ? <div className="create-twin-options">
          {availableMasks.map((mask) => <button type="button" key={mask.id} className={`create-twin-option ${selectedId === String(mask.id) ? 'selected' : ''}`} onClick={() => setSelectedId(String(mask.id))}>
            <span className="create-twin-avatar">{mask.avatarUrl ? <img src={mask.avatarUrl} alt="" /> : mask.name.slice(0, 1)}</span>
            <span className="create-twin-option-copy"><strong>{mask.name}</strong><small>{[mask.profession, mask.era].filter(Boolean).join(' · ') || 'A voice from history'}</small></span>
            <span className="create-twin-radio" aria-hidden="true" />
          </button>)}
          {!availableMasks.length && <div className="create-twin-empty"><h3>Every available voice is already in Your Twins.</h3><p>When more characters are added to Explore, you can create another twin here.</p></div>}
        </div> : <div className="create-twin-custom-fields">
          <label className="create-twin-name-label">What should your twin be called?<input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required /></label>
          <fieldset className="create-twin-gender"><legend>Choose a gender style <span>(optional)</span></legend>
            {[['male', 'Male'], ['female', 'Female'], ['unspecified', 'Let my chat style lead']].map(([value, label]) => <label key={value} className={gender === value ? 'selected' : ''}><input type="radio" name="twin-gender" value={value} checked={gender === value} onChange={() => setGender(value)} /><span>{label}</span></label>)}
          </fieldset>
          <p className="create-twin-style-note">Your twin will still learn your communication style from your answers and chats. With no gender preference, it starts with a friendly, easygoing personality and follows your lead.</p>
        </div>}
        {error && <p className="dashboard-error" role="alert">{error}</p>}
        <div className="create-twin-actions">
          <button className="dashboard-outline-link" type="button" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="dashboard-primary-link" type="submit" disabled={!canCreate || busy}>{busy ? 'Creating…' : 'Create your twin'} <FaArrowRight /></button>
        </div>
      </form>
    </div>
  )
}

export default CreateTwinModal
