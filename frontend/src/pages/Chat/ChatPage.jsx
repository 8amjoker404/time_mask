import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { FaArrowLeft, FaPaperPlane } from 'react-icons/fa6'
import { masksApi } from '../../api/masks'
import { conversationsApi } from '../../api/conversations'
import { apiError } from '../../api/client'
import TypingIndicator from '../../components/TypingIndicator'
import { twinsApi } from '../../api/twins'
import TwinInterview from '../../components/TwinInterview'

function ChatPage() {
  const { maskId } = useParams()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [mask, setMask] = useState(null)
  const conversationId = searchParams.get('conversationId')
  const [messages, setMessages] = useState([])
  const [loadingConversation, setLoadingConversation] = useState(true)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [twinInterview, setTwinInterview] = useState({ maskId: null, loading: true, isTwin: false, answers: [], completed: false })
  const twinProfilePending = twinInterview.maskId !== maskId || twinInterview.loading
  const returnPath = location.state?.from === '/twins' ? '/twins' : `/characters/${maskId}`
  const returnLabel = returnPath === '/twins' ? 'Your Twins' : 'Character profile'
  const tailRef = useRef(null)

  useEffect(() => {
    let active = true
    Promise.all([masksApi.get(maskId).catch(() => null), twinsApi.interview(maskId)]).then(([publicMask, profile]) => {
      if (!active) return
      if (publicMask || profile.mask) setMask(publicMask || profile.mask)
      else setError('This twin could not be found in your account.')
      setTwinInterview({ ...profile, maskId, loading: false })
    }).catch((err) => {
      if (active) {
        setTwinInterview({ maskId, loading: false, isTwin: false, answers: [], completed: false })
        setError(apiError(err))
      }
    })
    return () => { active = false }
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
    if (!draft.trim() || busy || loadingConversation || twinProfilePending || (twinInterview.isTwin && !twinInterview.completed)) return
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

  async function saveInterview(answers, completed) {
    const profile = await twinsApi.saveInterview(maskId, answers, completed)
    setTwinInterview({ ...profile, maskId, loading: false })
  }

  return (
    <div className="dashboard-page chat-page-dashboard">
      <Link className="dashboard-back-link" to={returnPath}><FaArrowLeft /> {returnLabel}</Link>
      {error && <p className="dashboard-error">{error}</p>}
      <section className="one-chat-panel">
        {twinProfilePending ? <div className="group-empty"><span>✳</span><h3>Preparing your conversation…</h3></div>
          : twinInterview.isTwin && !twinInterview.completed ? <TwinInterview mask={mask || { name: 'Your twin' }} answers={twinInterview.answers} onSave={saveInterview} /> : <>
        <header className="one-chat-heading"><span className="dashboard-mask-monogram">{mask?.avatarUrl ? <img src={mask.avatarUrl} alt="" /> : mask?.name?.slice(0, 1) || '✳'}</span><div><p className="dashboard-eyebrow">{mask?.isCustomTwin ? 'YOUR PERSONAL TWIN' : 'A CONVERSATION ACROSS TIME'}</p><h1>{mask?.name || 'Loading mask…'}</h1><small>{[mask?.profession, mask?.era].filter(Boolean).join(' · ')}</small></div></header>
        <div className="one-chat-messages" aria-live="polite">
          {messages.length ? messages.map((item, index) => <div className={`group-message ${item.role}`} key={item.id || `${item.role}-${index}`}><small>{item.role === 'user' ? 'You' : mask?.name}</small><p>{item.content}</p></div>) : <div className="group-empty"><span>✳</span><h3>Begin with a question.</h3><p>Ask about an idea, a moment in history, or simply say hello.</p></div>}
          {busy && <div className="group-message assistant typing-message"><small>{mask?.name}</small><TypingIndicator name={mask?.name || 'The character'} /></div>}<div ref={tailRef}/>
        </div>
        <form className="group-composer" onSubmit={send}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={loadingConversation ? 'Resuming your conversation…' : `Write to ${mask?.name || 'this mask'}…`} disabled={loadingConversation} /><button disabled={!draft.trim() || busy || loadingConversation || !mask} aria-label="Send message"><FaPaperPlane /></button></form>
        <p className="dashboard-footnote">{mask?.isCustomTwin ? 'An AI companion shaped by your answers and conversation style.' : 'AI-generated historical interpretations, not historical quotations.'}</p>
        </>}
      </section>
    </div>
  )
}

export default ChatPage
