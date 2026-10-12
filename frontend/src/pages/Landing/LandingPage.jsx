import { useEffect, useMemo, useState } from 'react'
import { FaReact } from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'
import { masksApi } from '../../api/masks'
import { apiError } from '../../api/client'
import '../../App.css'

const featuredMasks = [
  { name: 'Cleopatra', era: 'Ptolemaic Egypt · 69–30 BCE', symbol: '♕', tone: 'rose', line: 'Power, poetry, and the art of being underestimated.' },
  { name: 'Leonardo da Vinci', era: 'Italian Renaissance · 1452–1519', symbol: '✳', tone: 'olive', line: 'Curiosity is the engine of everything worth knowing.' },
  { name: 'Ada Lovelace', era: 'Victorian England · 1815–1852', symbol: '⌘', tone: 'blue', line: 'Imagination can be the beginning of discovery.' },
  { name: 'Marcus Aurelius', era: 'Roman Empire · 121–180 CE', symbol: '◉', tone: 'sand', line: 'A quiet mind can meet a noisy world.' },
]

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  if (name === 'search') return <svg {...common}><circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4.3 4.3"/></svg>
  if (name === 'settings') return <svg {...common}><path d="M12 8.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z"/><path d="m19.4 13.5 1 .8-1.5 2.7-1.2-.4a7.5 7.5 0 0 1-1.5.9l-.2 1.3h-3.1l-.3-1.3a7.5 7.5 0 0 1-1.5-.9l-1.2.4-1.5-2.7 1-.8a7.4 7.4 0 0 1 0-1.8l-1-.8 1.5-2.7 1.2.4a7.5 7.5 0 0 1 1.5-.9l.3-1.3h3.1l.2 1.3a7.5 7.5 0 0 1 1.5.9l1.2-.4 1.5 2.7-1 .8a7.4 7.4 0 0 1 0 1.8Z" transform="translate(-1.2 -1)"/></svg>
  if (name === 'arrow') return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6"/></svg>
  if (name === 'close') return <svg {...common}><path d="m6 6 12 12M18 6 6 18"/></svg>
  if (name === 'send') return <svg {...common}><path d="m21 3-7.3 18-3.8-7.9L2 9.3 21 3Z"/><path d="M9.9 13.1 15 8"/></svg>
  if (name === 'back') return <svg {...common}><path d="m15 18-6-6 6-6"/></svg>
  if (name === 'spark') return <svg {...common}><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3ZM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/></svg>
  return null
}

function App() {
  const navigate = useNavigate()
  const [masks, setMasks] = useState([])
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    masksApi.list().then((available) => { if (available?.length) setMasks(available) }).catch(() => {})
  }, [])

  const allMasks = useMemo(() => {
    const live = masks.map((mask, index) => ({ ...mask, symbol: ['♕', '✳', '⌘', '◉'][index % 4], tone: ['rose', 'olive', 'blue', 'sand'][index % 4], line: mask.summary || 'Step into a different point of view.' }))
    return live.length ? live : featuredMasks
  }, [masks])
  const visibleMasks = allMasks.filter((mask) => `${mask.name} ${mask.era || ''} ${mask.summary || ''}`.toLowerCase().includes(query.toLowerCase()))

  const openMask = (mask) => {
    setSelected(mask)
    setMessages([])
    setConversationId(null)
    setNotice('')
  }

  async function sendMessage(event) {
    event.preventDefault()
    if (!message.trim() || sending || !selected?.id) return
    if (!window.localStorage.getItem('time-mask-token')) {
      navigate('/login')
      return
    }
    const text = message.trim()
    setMessages((current) => [...current, { role: 'user', content: text }])
    setMessage('')
    setSending(true)
    setNotice('')
    try {
      const data = await masksApi.chat(selected.id, { message: text, conversationId })
      setConversationId(data.conversationId)
      setMessages((current) => [...current, { role: 'assistant', content: data.reply }])
    } catch (error) {
      setNotice(apiError(error))
    } finally { setSending(false) }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" onClick={() => setSelected(null)} aria-label="Time Mask home">
          <span className="brand-mark"><span /></span>
          <span>TIME <i>MASK</i></span>
        </a>
        <nav className="topnav" aria-label="Main navigation">
          <a href="#collection">The collection</a>
          <a href="#about">Our approach</a>
        </nav>
        <Link className="account-button" to="/login">Sign in</Link>
      </header>

      {selected ? (
        <section className="chat-page">
          <button className="back-button" onClick={() => setSelected(null)}><Icon name="back" /> All masks</button>
          <div className="chat-frame">
            <aside className="chat-persona">
              <div className={`portrait portrait-${selected.tone}`}><span>{selected.symbol}</span><i className="portrait-orbit orbit-one"/><i className="portrait-orbit orbit-two"/></div>
              <p className="eyebrow">A conversation across time</p>
              <h1>{selected.name}</h1>
              <p className="persona-era">{selected.era || 'A voice from history'}</p>
              <p className="persona-note">An AI interpretation shaped by historical records, personal accounts, and a considered character portrait.</p>
              <div className="chat-disclaimer"><Icon name="spark" /> A historical perspective, imagined with care.</div>
            </aside>
            <div className="chat-main">
              <div className="chat-heading"><div><span className="eyebrow">THE SALON</span><h2>Your conversation</h2></div><span className="online-label"><i /> Ready to listen</span></div>
              <div className="chat-messages" aria-live="polite">
                {messages.length === 0 && <div className="welcome-message"><div className="welcome-spark"><Icon name="spark" size={22} /></div><p className="eyebrow">THE FIRST QUESTION IS YOURS</p><h3>What would you like to ask {selected.name.split(' ')[0]}?</h3><p>Explore an idea, ask about their time, or simply begin with hello.</p></div>}
                {messages.map((item, index) => <div key={`${index}-${item.role}`} className={`message-row ${item.role}`}><span className="message-author">{item.role === 'assistant' ? selected.name : 'You'}</span><div className="message-bubble">{item.content}</div></div>)}
                {sending && <div className="message-row assistant"><span className="message-author">{selected.name}</span><div className="message-bubble typing"><i/><i/><i/></div></div>}
              </div>
              {notice && <p className="inline-notice">{notice}</p>}
              <form className="composer" onSubmit={sendMessage}>
                <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder={`Write to ${selected.name}…`} aria-label="Your message" />
                <button type="submit" disabled={!message.trim() || sending || !selected.id} aria-label="Send message"><Icon name="send" /></button>
              </form>
              {!selected.id && <p className="backend-hint">Connect the backend and add a mask to begin a live conversation.</p>}
              {selected.id && !window.localStorage.getItem('time-mask-token') && <Link className="auth-inline-link" to="/login">Sign in to start your conversation</Link>}
              <p className="composer-footnote">Responses are AI-generated interpretations, not historical quotations.</p>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="hero-section" id="home">
            <div className="hero-copy">
              <div className="hero-kicker"><span /> HISTORY, IN CONVERSATION</div>
              <h1>Some voices<br/>deserve <em>another</em><br/>moment.</h1>
              <p className="hero-description">Meet the people who shaped our world. Thoughtful AI personas bring historical perspectives into a conversation that starts with you.</p>
              <a className="primary-link" href="#collection">Meet the masks <Icon name="arrow" /></a>
              <div className="hero-caption"><span className="caption-line"/><span>PERSONALITIES THROUGH TIME</span></div>
            </div>
            <div className="hero-art" aria-label="An evocative portrait from the past">
              <div className="art-backdrop"><div className="art-ring ring-a"/><div className="art-ring ring-b"/><div className="art-sun"/><div className="art-orbit"><i/><i/><i/></div><div className="bust-shadow"/><div className="bust"><div className="bust-hair"/><div className="bust-face"><i className="bust-eye"/><i className="bust-nose"/><i className="bust-lips"/></div><div className="bust-neck"/><div className="bust-body"><i/></div></div><div className="art-stamp">THE<br/><b>TIME</b><br/>COLLECTION</div><span className="art-roman">MMXXV</span></div>
              <div className="hero-art-note"><span>01 / 04</span><span>EVERY ERA HAS A STORY</span></div>
            </div>
            <div className="hero-side-label">A WINDOW INTO ANOTHER WORLD</div>
          </section>

          <section className="collection-section" id="collection">
            <div className="section-heading"><div><p className="eyebrow">A GROWING COLLECTION</p><h2>Who will you <em>meet?</em></h2></div><label className="search-box"><Icon name="search"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a voice" aria-label="Search historical masks"/><kbd>⌘ K</kbd></label></div>
            <div className="mask-grid">{visibleMasks.map((mask, index) => <button className="mask-card" key={mask.id || mask.name} onClick={() => openMask(mask)}>
              <div className={`mask-art mask-${mask.tone}`}>{mask.avatarUrl ? <img className="mask-portrait-image" src={mask.avatarUrl} alt="" loading="lazy" /> : <><div className="mask-halo"/><span className="mask-symbol">{mask.symbol}</span></>}<span className="card-index">0{index + 1}</span><span className="card-arrow"><Icon name="arrow" size={16}/></span></div>
              <div className="mask-card-copy"><p className="mask-era">{mask.era || 'A voice from history'}</p><h3>{mask.name}</h3>{mask.profession && <p className="mask-profession">{mask.profession}</p>}<p className="mask-line">{mask.line}</p></div>
            </button>)}</div>
            {visibleMasks.length === 0 && <p className="empty-search">No voices found. Try another name or era.</p>}
            <div className="collection-foot"><span>THE PAST IS NOT AS FAR AWAY AS IT SEEMS.</span><span>{String(visibleMasks.length).padStart(2, '0')} VOICES <i>·</i> MORE TO COME</span></div>
          </section>

          <section className="manifesto" id="about"><div className="manifesto-symbol"><span>“</span></div><div><p className="eyebrow">A NOTE ON THE MASK</p><h2>History gives us the outline.<br/><em>Conversation brings it closer.</em></h2><p>Each mask is an interpretation shaped by historical evidence, personal accounts, and detailed character work. They offer a way to explore the ideas and perspectives of another time—with curiosity, and with care.</p></div><div className="manifesto-seal">PAST<br/><span>✳</span><br/>PRESENT</div></section>
          <footer className="site-footer"><a className="brand" href="#home"><span className="brand-mark"><span /></span><span>TIME <i>MASK</i></span></a><span>AN OPENING BETWEEN THEN AND NOW.</span><span className="footer-credit"><FaReact aria-label="React" /> © TIME MASK 2025</span></footer>
        </>
      )}

    </main>
  )
}

export default App
