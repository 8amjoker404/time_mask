import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa6'
import { masksApi } from '../../api/masks'
import { twinsApi } from '../../api/twins'
import { apiError } from '../../api/client'

function MaskProfilePage() {
  const { maskId } = useParams()
  const [mask, setMask] = useState(null)
  const [error, setError] = useState('')
  const [isPersonalTwin, setIsPersonalTwin] = useState(false)

  useEffect(() => {
    let active = true
    async function loadProfile() {
      try {
        const character = await masksApi.get(maskId, { suppressErrorToast: true })
        if (active) setMask(character)
      } catch (publicMaskError) {
        if (publicMaskError.response?.status !== 404) {
          if (active) setError(apiError(publicMaskError))
          return
        }
        try {
          const twins = await twinsApi.list({ suppressErrorToast: true })
          const twin = twins.find((item) => String(item.id) === String(maskId))
          if (!active) return
          if (twin) {
            setMask(twin)
            setIsPersonalTwin(Boolean(twin.isCustomTwin))
          } else {
            setError('This character is not in the collection or your twins.')
          }
        } catch (err) {
          if (active) setError(apiError(err))
        }
      }
    }
    loadProfile()
    return () => { active = false }
  }, [maskId])

  if (error) return <div className="dashboard-page"><Link className="dashboard-back-link" to="/explore"><FaArrowLeft /> Explore</Link><p className="dashboard-error">{error}</p></div>
  if (!mask) return <div className="dashboard-page"><p className="dashboard-eyebrow">HISTORICAL PROFILE</p><h1>Loading <em>history…</em></h1></div>

  const years = mask.era?.match(/\d{1,4}\s*(?:BCE|CE)?\s*[–-]\s*\d{1,4}\s*(?:BCE|CE)?/i)?.[0] || mask.era || 'Years unknown'

  return (
    <div className="dashboard-page">
      <Link className="dashboard-back-link" to={isPersonalTwin ? '/twins' : '/explore'}><FaArrowLeft /> {isPersonalTwin ? 'Back to Your Twins' : 'Back to Explore'}</Link>
      <article className="character-profile">
        <div className="character-profile-portrait">
          {mask.avatarUrl ? <img src={mask.avatarUrl} alt={`Portrait of ${mask.name}`} /> : <span>{mask.name.slice(0, 1)}</span>}
          <span className="character-profile-years">{years}</span>
        </div>
        <div className="character-profile-copy">
          <p className="dashboard-eyebrow">{isPersonalTwin ? 'YOUR PERSONAL TWIN' : 'A VOICE FROM HISTORY'}</p>
          <h1>{mask.name}</h1>
          <p className="character-profile-meta">{[mask.profession, mask.era].filter(Boolean).join(' · ')}</p>
          <div className="character-profile-bio"><h2>Biography</h2><p>{mask.summary || 'A historical profile is being prepared.'}</p></div>
          <Link className="dashboard-primary-link character-chat-link" to={`/chat/${mask.id}`}>Chat with {mask.name.split(' ')[0]} <FaArrowRight /></Link>
          <p className="dashboard-footnote">{isPersonalTwin ? 'A private AI companion shaped by your interview answers and conversations.' : 'An AI-generated historical interpretation, not the historical person or a source of direct quotations.'}</p>
        </div>
      </article>
    </div>
  )
}

export default MaskProfilePage
