import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaArrowLeft, FaMagnifyingGlass } from 'react-icons/fa6'
import MaskCard from '../../components/MaskCard'
import { masksApi } from '../../api/masks'
import { twinsApi } from '../../api/twins'
import { apiError } from '../../api/client'

function ExplorePage() {
  const [masks, setMasks] = useState([])
  const [savedIds, setSavedIds] = useState(new Set())
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([masksApi.list(), twinsApi.list()]).then(([available, saved]) => {
      setMasks(available)
      setSavedIds(new Set(saved.map((mask) => String(mask.id))))
    }).catch((err) => setError(apiError(err)))
  }, [])

  const visibleMasks = useMemo(() => masks.filter((mask) => `${mask.name} ${mask.era || ''} ${mask.summary || ''}`.toLowerCase().includes(query.toLowerCase())), [masks, query])
  async function toggleSaved(mask) {
    const id = String(mask.id)
    try {
      if (savedIds.has(id)) {
        await twinsApi.remove(mask.id)
        setSavedIds((current) => new Set([...current].filter((savedId) => savedId !== id)))
      } else {
        await twinsApi.save(mask.id)
        setSavedIds((current) => new Set([...current, id]))
      }
    } catch (err) { setError(apiError(err)) }
  }

  return (
    <div className="dashboard-page">
      <div className="page-title-row"><div><p className="dashboard-eyebrow">A GROWING COLLECTION</p><h1>Explore <em>history.</em></h1><p>Find a voice, save a twin, and start a conversation.</p></div><div className="explore-tools"><Link className="explore-back-link" to="/dashboard"><FaArrowLeft /> <span>Back to dashboard</span></Link><label className="dashboard-search"><FaMagnifyingGlass /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search names or eras" /></label></div></div>
      {error && <p className="dashboard-error">{error}</p>}
      {visibleMasks.length ? <div className="dashboard-mask-grid">{visibleMasks.map((mask, index) => <MaskCard key={mask.id} mask={mask} index={index} saved={savedIds.has(String(mask.id))} onToggleSaved={toggleSaved} />)}</div> : <div className="dashboard-empty"><span>✳</span><h3>{error ? 'The collection is not available.' : 'No masks found yet.'}</h3><p>{error || 'Masks will appear here when they have been added to the collection.'}</p></div>}
    </div>
  )
}

export default ExplorePage
