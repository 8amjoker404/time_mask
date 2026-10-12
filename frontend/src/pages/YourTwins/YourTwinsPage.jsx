import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MaskCard from '../../components/MaskCard'
import { twinsApi } from '../../api/twins'
import { apiError, notifyToast } from '../../api/client'

function YourTwinsPage() {
  const [twins, setTwins] = useState([])
  const [error, setError] = useState('')
  const loadTwins = useCallback(() => twinsApi.list().then(setTwins).catch((err) => setError(apiError(err))), [])
  useEffect(() => { loadTwins() }, [loadTwins])

  async function removeTwin(mask) {
    try {
      await twinsApi.remove(mask.id)
      setTwins((current) => current.filter((twin) => twin.id !== mask.id))
      notifyToast(`${mask.name} removed from Your Twins.`)
    } catch (err) { setError(apiError(err)) }
  }

  return (
    <div className="dashboard-page">
      <div className="page-title-row"><div><p className="dashboard-eyebrow">YOUR PERSONAL COLLECTION</p><h1>Your <em>Twins.</em></h1><p>Historical voices you have saved for another conversation.</p></div><Link className="dashboard-outline-link" to="/explore">Find more masks <span>→</span></Link></div>
      {error && <p className="dashboard-error">{error}</p>}
      {twins.length ? <div className="dashboard-mask-grid">{twins.map((mask, index) => <MaskCard key={mask.id} mask={mask} index={index} saved onToggleSaved={removeTwin} />)}</div> : <div className="dashboard-empty"><span>♕</span><h3>Your collection starts with a voice.</h3><p>Save historical masks you want to return to. They will live here in Your Twins.</p><Link to="/explore">Explore the collection <span>→</span></Link></div>}
    </div>
  )
}

export default YourTwinsPage
