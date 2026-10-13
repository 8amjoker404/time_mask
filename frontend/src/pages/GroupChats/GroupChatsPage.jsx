import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FaArrowRight, FaPaperPlane, FaPlus, FaUsers } from 'react-icons/fa6'
import { groupsApi } from '../../api/groups'
import { masksApi } from '../../api/masks'
import { apiError, conversationError, isTemporaryAIError, notifyToast } from '../../api/client'
import TypingIndicator from '../../components/TypingIndicator'

function GroupChatsPage() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [masks, setMasks] = useState([])
  const [members, setMembers] = useState([])
  const [messages, setMessages] = useState([])
  const [createOpen, setCreateOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [draft, setDraft] = useState('')
  const [mentionQuery, setMentionQuery] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const tailRef = useRef(null)
  const composerRef = useRef(null)

  useEffect(() => {
    groupsApi.list().then(setGroups).catch((err) => setError(apiError(err)))
    masksApi.list().then(setMasks).catch((err) => setError(apiError(err)))
  }, [])

  useEffect(() => {
    if (!groupId) return
    let active = true
    setMessages([])
    setMembers([])
    Promise.all([groupsApi.messages(groupId), groupsApi.members(groupId)])
      .then(([savedMessages, groupMembers]) => {
        if (!active) return
        setMessages(savedMessages)
        setMembers(groupMembers)
      })
      .catch((err) => { if (active) setError(apiError(err)) })
    return () => { active = false }
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
    setMentionQuery(null)
    setMessages((current) => [...current, { role: 'user', content: text }])
    setBusy(true)
    setError('')
    try {
      const replies = await groupsApi.send(groupId, text, { suppressErrorToast: true })
      setMessages((current) => [...current, ...replies])
    } catch (err) {
      setMessages((current) => current.at(-1)?.role === 'user' && current.at(-1)?.content === text ? current.slice(0, -1) : current)
      setDraft(text)
      setError(isTemporaryAIError(err) ? 'The group is taking a brief pause. Your conversation is safe, and your message is waiting here for another try.' : conversationError(err, 'The group'))
    } finally { setBusy(false) }
  }

  const activeGroup = groups.find((group) => String(group.id) === groupId)
  const matchingMembers = useMemo(() => mentionQuery === null ? [] : members
    .filter((member) => member.name.toLocaleLowerCase().includes(mentionQuery.trim().toLocaleLowerCase()))
    .slice(0, 6), [members, mentionQuery])

  function updateDraft(event) {
    const value = event.target.value
    const cursor = event.target.selectionStart ?? value.length
    const beforeCursor = value.slice(0, cursor)
    const match = beforeCursor.match(/(?:^|\s)@([^@\n]*)$/)
    setDraft(value)
    setMentionQuery(match ? match[1] : null)
  }

  function insertMention(member) {
    const input = composerRef.current
    const cursor = input?.selectionStart ?? draft.length
    const before = draft.slice(0, cursor)
    const mentionStart = before.lastIndexOf('@')
    const nextDraft = `${before.slice(0, mentionStart)}@${member.name} ${draft.slice(cursor)}`
    setDraft(nextDraft)
    setMentionQuery(null)
    requestAnimationFrame(() => {
      input?.focus()
      const nextCursor = before.slice(0, mentionStart).length + member.name.length + 2
      input?.setSelectionRange(nextCursor, nextCursor)
    })
  }

  return (
    <div className="dashboard-page group-page">
      <div className="page-title-row"><div><p className="dashboard-eyebrow">A TABLE FOR MANY VOICES</p><h1>Group <em>Chats.</em></h1><p>Bring a few historical minds into the same conversation.</p></div><button className="dashboard-primary-link" onClick={() => setCreateOpen(true)}><FaPlus /> New group</button></div>
      {error && <p className={error.includes('brief pause') ? 'dashboard-success chat-pause-note' : 'dashboard-error'} role="status">{error}</p>}
      <div className="group-layout">
        <aside className="group-list-panel">
          <div className="group-list-heading"><FaUsers /><span>Your groups</span><b>{groups.length}</b></div>
          {groups.length ? groups.map((group) => <button key={group.id} className={`group-list-item ${String(group.id) === groupId ? 'selected' : ''}`} onClick={() => navigate(`/groups/${group.id}`)}><span className="group-list-icon"><FaUsers /></span><span><strong>{group.name}</strong><small>{group.memberCount} historical voices</small></span><FaArrowRight /></button>) : <p className="group-list-empty">Your group conversations will appear here.</p>}
        </aside>
        <section className="group-chat-panel">
          {activeGroup ? <>
            <div className="group-chat-heading"><div className="group-list-icon"><FaUsers /></div><div><h2>{activeGroup.name}</h2><p>{activeGroup.memberCount} historical voices{members.length > 0 ? ` · ${members.map((member) => member.name).join(' · ')}` : ''}</p></div></div>
            <div className="group-messages" aria-live="polite">
              {messages.length ? messages.map((item, index) => <div className={`group-message ${item.role}`} key={item.id || `${item.role}-${index}`}><small>{item.role === 'user' ? 'You' : item.maskName}</small><p>{item.content}</p></div>) : <div className="group-empty"><span>✳</span><h3>Start the conversation.</h3><p>Ask your group a question. Each mask will bring their own perspective.</p></div>}
              {busy && <TypingIndicator name="The group" className="group-thinking" />}
              <div ref={tailRef} />
            </div>
            <div className="group-composer-wrap">{matchingMembers.length > 0 && <div className="group-mention-menu" role="listbox" aria-label="Tag a group member">{matchingMembers.map((member) => <button type="button" role="option" aria-selected="false" key={member.id} onMouseDown={(event) => event.preventDefault()} onClick={() => insertMention(member)}><span className="group-member-avatar">{member.name.slice(0, 1)}</span><span><strong>{member.name}</strong><small>{[member.profession, member.era].filter(Boolean).join(' · ')}</small></span></button>)}</div>}<form className="group-composer" onSubmit={sendMessage}><input ref={composerRef} value={draft} onChange={updateDraft} onBlur={() => window.setTimeout(() => setMentionQuery(null), 120)} placeholder="Message the group or type @ to tag someone…" aria-label="Group message"/><button disabled={!draft.trim() || busy} aria-label="Send to group"><FaPaperPlane /></button></form><small className="group-composer-hint">Tag a member with @ to direct your message. Otherwise, the most relevant voices will join in.</small></div>
            <p className="dashboard-footnote">AI-generated historical interpretations, not historical quotations.</p>
          </> : <div className="group-empty"><span><FaUsers /></span><h3>Make room for a conversation.</h3><p>Create a group and invite a few historical minds to your table.</p><button className="dashboard-outline-link" onClick={() => setCreateOpen(true)}>Create a group <span>→</span></button></div>}
        </section>
      </div>
      {createOpen && <div className="dashboard-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreateOpen(false) }}><form className="dashboard-modal" onSubmit={createGroup}><button className="dashboard-modal-close" type="button" onClick={() => setCreateOpen(false)}>×</button><p className="dashboard-eyebrow">START A SALON</p><h2>Create a group chat</h2><label>Group name<input value={groupName} onChange={(event) => setGroupName(event.target.value)} maxLength={120} required placeholder="A name for this gathering" /></label><fieldset><legend>Choose 1–6 masks</legend>{masks.map((mask) => <label className="mask-picker-option" key={mask.id}><input type="checkbox" checked={selectedIds.includes(mask.id)} onChange={() => setSelectedIds((current) => current.includes(mask.id) ? current.filter((id) => id !== mask.id) : [...current, mask.id])} /><span><strong>{mask.name}</strong><small>{mask.era}</small></span></label>)}</fieldset><button className="dashboard-primary-link" disabled={!groupName.trim() || !selectedIds.length || selectedIds.length > 6} type="submit">Create group <FaArrowRight /></button></form></div>}
    </div>
  )
}

export default GroupChatsPage
