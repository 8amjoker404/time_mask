import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { FaArrowLeft, FaPaperPlane } from 'react-icons/fa6'
import { masksApi } from '../../api/masks'
import { conversationsApi } from '../../api/conversations'
import { apiError } from '../../api/client'
import TypingIndicator from '../../components/TypingIndicator'

function ChatPage() {
  const { maskId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [mask, setMask] = useState(null)
  const conversationId = searchParams.get('conversationId')
  const [messages, setMessages] = useState([])
  const [loadingConversation, setLoadingConversation] = useState(true)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const tailRef = useRef(null)

  useEffect(() => {
    masksApi.get(maskId).then(setMask).catch((err) => setError(apiError(err)))
  }, [maskId])
  useEffect(() => {
    let active = true
    async function loadConversation() {
      setLoadingConversation(true)
      const id = searchParams.get('conversationId')
      try {
        if (id) {
          const savedMessages = await conversationsApi.messages(id)
          if (active) setMessages(savedMessages)
          return
        }
        setMessages([])
        const saved = await conversationsApi.byMask(maskId)
        if (active && saved.conversationId) {
          setSearchParams({ conversationId: saved.conversationId }, { replace: true })
        }
      } catch (err) {
        if (active) setError(apiError(err))
      } finally {
        if (active) setLoadingConversation(false)
      }
    }
    loadConversation()
    return () => { active = false }
  }, [maskId, searchParams, setSearchParams])
  useEffect(() => { tailRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(event) {
    event.preventDefault()
    if (!draft.trim() || busy || loadingConversation) return
    const text = draft.trim()
    setDraft('')
    setMessages((current) => [...current, { role: 'user', content: text }])
    setBusy(true)
    setError('')
    try {
      const response = await masksApi.chat(maskId, { message: text, conversationId })
      if (!conversationId) setSearchParams({ conversationId: response.conversationId }, { replace: true })
      else setMessages((current) => [...current, { role: 'assistant', content: response.reply }])
    } catch (err) { setError(apiError(err)) } finally { setBusy(false) }
  }

  return (
    <div className="dashboard-page chat-page-dashboard">
      <Link className="dashboard-back-link" to={`/characters/${maskId}`}><FaArrowLeft /> Character profile</Link>
      {error && <p className="dashboard-error">{error}</p>}
      <section className="one-chat-panel">
        <header className="one-chat-heading"><span className="dashboard-mask-monogram">{mask?.avatarUrl ? <img src={mask.avatarUrl} alt="" /> : mask?.name?.slice(0, 1) || '✳'}</span><div><p className="dashboard-eyebrow">A CONVERSATION ACROSS TIME</p><h1>{mask?.name || 'Loading mask…'}</h1><small>{[mask?.profession, mask?.era].filter(Boolean).join(' · ')}</small></div></header>
        <div className="one-chat-messages" aria-live="polite">
          {messages.length ? messages.map((item, index) => <div className={`group-message ${item.role}`} key={item.id || `${item.role}-${index}`}><small>{item.role === 'user' ? 'You' : mask?.name}</small><p>{item.content}</p></div>) : <div className="group-empty"><span>✳</span><h3>Begin with a question.</h3><p>Ask about an idea, a moment in history, or simply say hello.</p></div>}
          {busy && <div className="group-message assistant typing-message"><small>{mask?.name}</small><TypingIndicator name={mask?.name || 'The character'} /></div>}<div ref={tailRef}/>
        </div>
        <form className="group-composer" onSubmit={send}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={loadingConversation ? 'Resuming your conversation…' : `Write to ${mask?.name || 'this mask'}…`} disabled={loadingConversation} /><button disabled={!draft.trim() || busy || loadingConversation || !mask} aria-label="Send message"><FaPaperPlane /></button></form>
        <p className="dashboard-footnote">AI-generated historical interpretations, not historical quotations.</p>
      </section>
    </div>
  )
}

export default ChatPage
