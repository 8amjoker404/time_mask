import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaArrowRight, FaComments, FaMasksTheater, FaCompass, FaUsers } from 'react-icons/fa6'
import { useAuth } from '../../context/useAuth'
import { conversationsApi } from '../../api/conversations'
import { groupsApi } from '../../api/groups'
import { twinsApi } from '../../api/twins'
import { apiError } from '../../api/client'

function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ twins: 0, groups: 0, conversations: 0 })
  const [recent, setRecent] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([twinsApi.list(), groupsApi.list(), conversationsApi.list()]).then(([twins, groups, conversations]) => {
      setStats({ twins: twins.length, groups: groups.length, conversations: conversations.length })
      setRecent(conversations.slice(0, 4))
    }).catch((err) => setError(apiError(err)))
  }, [])

  return (
    <div className="dashboard-page">
      <div className="dashboard-welcome">
        <p className="dashboard-eyebrow">YOUR TIME MASK</p>
        <h1>Welcome back, <em>{user?.name?.split(' ')[0] || 'traveler'}.</em></h1>
        <p>Pick up a conversation or find a new perspective in history.</p>
        <Link className="dashboard-primary-link" to="/explore">Explore the collection <FaArrowRight /></Link>
      </div>

      <section className="dashboard-stat-grid" aria-label="Your activity">
        <Link to="/twins" className="dashboard-stat-card"><FaMasksTheater /><span>YOUR TWINS</span><strong>{stats.twins}</strong><small>personal AI companions</small></Link>
        <Link to="/groups" className="dashboard-stat-card"><FaUsers /><span>GROUP CHATS</span><strong>{stats.groups}</strong><small>salons you created</small></Link>
        <div className="dashboard-stat-card"><FaComments /><span>CONVERSATIONS</span><strong>{stats.conversations}</strong><small>one to one chats</small></div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-heading"><div><p className="dashboard-eyebrow">PICK UP WHERE YOU LEFT OFF</p><h2>Recent conversations</h2></div><Link to="/explore">Find someone new <FaArrowRight /></Link></div>
        {error && <p className="dashboard-error">{error}</p>}
        {recent.length ? <div className="recent-conversations">{recent.map((conversation) => <Link key={conversation.id} to={`/chat/${conversation.maskId}?conversationId=${conversation.id}`} className="recent-conversation"><span className="recent-avatar">{conversation.maskName?.slice(0, 1)}</span><span><strong>{conversation.maskName}</strong><small>{conversation.lastMessage || 'Continue your conversation'}</small></span><FaArrowRight /></Link>)}</div> : <div className="dashboard-empty"><span><FaCompass /></span><h3>Your next conversation is waiting.</h3><p>Meet a historical voice and start exploring a new point of view.</p><Link to="/explore">Explore historical masks <FaArrowRight /></Link></div>}
      </section>
    </div>
  )
}

export default DashboardPage
