import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FaArrowRight, FaPaperPlane, FaPlus, FaUsers } from 'react-icons/fa6'
import { groupsApi } from '../../api/groups'
import { masksApi } from '../../api/masks'
import { apiError, notifyToast } from '../../api/client'
import TypingIndicator from '../../components/TypingIndicator'

function GroupChatsPage() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [masks, setMasks] = useState([])
  const [messages, setMessages] = useState([])
  const [createOpen, setCreateOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const tailRef = useRef(null)

  useEffect(() => {
    groupsApi.list().then(setGroups).catch((err) => setError(apiError(err)))
    masksApi.list().then(setMasks).catch((err) => setError(apiError(err)))
  }, [])

  useEffect(() => {
    if (!groupId) return
    groupsApi.messages(groupId).then(setMessages).catch((err) => setError(apiError(err)))
  }, [groupId])

  useEffect(() => { tailRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function createGroup(event) {
    event.preventDefault()
    try {
      const group = await groupsApi.create({ name: groupName, maskIds: selectedIds })
      setGroups((current) => [group, ...current])
      setGroupName('')
      setSelectedIds([])
      setCreateOpen(false)
      notifyToast(`${group.name} group chat created.`)
      navigate(`/groups/${group.id}`)
    } catch (err) { setError(apiError(err)) }
  }

  async function sendMessage(event) {
    event.preventDefault()
    if (!draft.trim() || !groupId || busy) return
    const text = draft.trim()
    setDraft('')
    setMessages((current) => [...current, { role: 'user', content: text }])
    setBusy(true)
    setError('')
    try {
      const replies = await groupsApi.send(groupId, text)
      setMessages((current) => [...current, ...replies])
    } catch (err) { setError(apiError(err)) } finally { setBusy(false) }
  }

  const activeGroup = groups.find((group) => String(group.id) === groupId)

  return (
    <div className="dashboard-page group-page">
      <div className="page-title-row"><div><p className="dashboard-eyebrow">A TABLE FOR MANY VOICES</p><h1>Group <em>Chats.</em></h1><p>Bring a few historical minds into the same conversation.</p></div><button className="dashboard-primary-link" onClick={() => setCreateOpen(true)}><FaPlus /> New group</button></div>
      {error && <p className="dashboard-error">{error}</p>}
      <div className="group-layout">
        <aside className="group-list-panel">
          <div className="group-list-heading"><FaUsers /><span>Your groups</span><b>{groups.length}</b></div>
          {groups.length ? groups.map((group) => <button key={group.id} className={`group-list-item ${String(group.id) === groupId ? 'selected' : ''}`} onClick={() => navigate(`/groups/${group.id}`)}><span className="group-list-icon"><FaUsers /></span><span><strong>{group.name}</strong><small>{group.memberCount} historical voices</small></span><FaArrowRight /></button>) : <p className="group-list-empty">Your group conversations will appear here.</p>}
        </aside>
        <section className="group-chat-panel">
          {activeGroup ? <>
            <div className="group-chat-heading"><div className="group-list-icon"><FaUsers /></div><div><h2>{activeGroup.name}</h2><p>{activeGroup.memberCount} historical voices</p></div></div>
            <div className="group-messages" aria-live="polite">
              {messages.length ? messages.map((item, index) => <div className={`group-message ${item.role}`} key={item.id || `${item.role}-${index}`}><small>{item.role === 'user' ? 'You' : item.maskName}</small><p>{item.content}</p></div>) : <div className="group-empty"><span>✳</span><h3>Start the conversation.</h3><p>Ask your group a question. Each mask will bring their own perspective.</p></div>}
              {busy && <TypingIndicator name="The group" className="group-thinking" />}
              <div ref={tailRef} />
            </div>
            <form className="group-composer" onSubmit={sendMessage}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask the group something…"/><button disabled={!draft.trim() || busy} aria-label="Send to group"><FaPaperPlane /></button></form>
            <p className="dashboard-footnote">AI-generated historical interpretations, not historical quotations.</p>
          </> : <div className="group-empty"><span><FaUsers /></span><h3>Make room for a conversation.</h3><p>Create a group and invite a few historical minds to your table.</p><button className="dashboard-outline-link" onClick={() => setCreateOpen(true)}>Create a group <span>→</span></button></div>}
        </section>
      </div>
      {createOpen && <div className="dashboard-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreateOpen(false) }}><form className="dashboard-modal" onSubmit={createGroup}><button className="dashboard-modal-close" type="button" onClick={() => setCreateOpen(false)}>×</button><p className="dashboard-eyebrow">START A SALON</p><h2>Create a group chat</h2><label>Group name<input value={groupName} onChange={(event) => setGroupName(event.target.value)} maxLength={120} required placeholder="A name for this gathering" /></label><fieldset><legend>Choose 1–6 masks</legend>{masks.map((mask) => <label className="mask-picker-option" key={mask.id}><input type="checkbox" checked={selectedIds.includes(mask.id)} onChange={() => setSelectedIds((current) => current.includes(mask.id) ? current.filter((id) => id !== mask.id) : [...current, mask.id])} /><span><strong>{mask.name}</strong><small>{mask.era}</small></span></label>)}</fieldset><button className="dashboard-primary-link" disabled={!groupName.trim() || !selectedIds.length || selectedIds.length > 6} type="submit">Create group <FaArrowRight /></button></form></div>}
    </div>
  )
}

export default GroupChatsPage
