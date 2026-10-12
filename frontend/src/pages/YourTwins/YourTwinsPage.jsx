import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaPlus } from 'react-icons/fa6'
import MaskCard from '../../components/MaskCard'
import CreateTwinModal from './CreateTwinModal'
import { masksApi } from '../../api/masks'
import { twinsApi } from '../../api/twins'
import { apiError, notifyToast } from '../../api/client'

function YourTwinsPage() {
  const [twins, setTwins] = useState([])
  const [masks, setMasks] = useState([])
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [loadingTwins, setLoadingTwins] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const loadTwins = useCallback(() => twinsApi.list().then((saved) => { setTwins(saved); setLoadingTwins(false) }).catch((err) => { setError(apiError(err)); setLoadingTwins(false) }), [])
  useEffect(() => { loadTwins() }, [loadTwins])
  const existingTwinIds = useMemo(() => new Set(twins.map((twin) => String(twin.id))), [twins])

  async function openCreate() {
    setError('')
    try {
      setMasks(await masksApi.list())
      setCreateOpen(true)
    } catch (err) { setError(apiError(err)) }
  }

  async function createTwin(selection) {
    setCreating(true)
    setError('')
    try {
      let twin
      if (selection.type === 'historical') {
        await twinsApi.save(selection.mask.id)
        twin = selection.mask
      } else {
        twin = await twinsApi.createCustom({ name: selection.name, gender: selection.gender })
      }
      const twinId = twin.id || twin.maskId
      notifyToast(`${twin.name} is now your twin. Let's get to know each other.`)
      navigate(`/chat/${twinId}`, { state: { from: '/twins' } })
    } catch (err) { setError(apiError(err)) } finally { setCreating(false) }
  }

  async function removeTwin(mask) {
    try {
      await twinsApi.remove(mask.id)
      setTwins((current) => current.filter((twin) => twin.id !== mask.id))
      notifyToast(`${mask.name} removed from Your Twins.`)
    } catch (err) { setError(apiError(err)) }
  }

  return (
    <div className="dashboard-page">
      <div className="page-title-row"><div><p className="dashboard-eyebrow">YOUR PERSONAL COLLECTION</p><h1>Your <em>Twins.</em></h1><p>Choose a historical voice, share a little about yourself, and build a lasting conversation.</p></div><button className="dashboard-primary-link create-twin-button" onClick={openCreate} disabled={loadingTwins}><FaPlus /> Create a twin</button></div>
      {error && <p className="dashboard-error">{error}</p>}
      {twins.length ? <div className="dashboard-mask-grid">{twins.map((mask, index) => <MaskCard key={mask.id} mask={mask} index={index} saved onToggleSaved={removeTwin} chatTo={`/chat/${mask.id}`} profileTo={mask.isCustomTwin ? `/chat/${mask.id}` : undefined} />)}</div> : !loadingTwins && <div className="dashboard-empty"><span>♕</span><h3>Your collection starts with a voice.</h3><p>Create a twin with a historical personality or start fresh and let your chats shape them.</p><button className="dashboard-outline-link" onClick={openCreate}>Create your first twin <span>→</span></button></div>}
      {createOpen && <CreateTwinModal masks={masks} existingTwinIds={existingTwinIds} busy={creating} error={error} onClose={() => setCreateOpen(false)} onCreate={createTwin} />}
    </div>
  )
}

export default YourTwinsPage
