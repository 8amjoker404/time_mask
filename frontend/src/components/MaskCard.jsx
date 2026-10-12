import { FaArrowRight, FaBookmark, FaRegBookmark } from 'react-icons/fa6'
import { Link } from 'react-router-dom'

const tones = ['rose', 'olive', 'blue', 'sand']
const symbols = ['♕', '✳', '⌘', '◉']

function MaskCard({ mask, index = 0, saved = false, onToggleSaved, chatTo, profileTo }) {
  const tone = mask.tone || tones[index % tones.length]
  const years = mask.isCustomTwin ? 'YOUR PERSONAL TWIN' : mask.era?.match(/\d{1,4}\s*(?:BCE|CE)?\s*[–-]\s*\d{1,4}\s*(?:BCE|CE)?/i)?.[0] || mask.era || 'Years unknown'
  const profilePath = profileTo || `/characters/${mask.id}`
  return (
    <article className="dashboard-mask-card">
      <Link to={profilePath} className={`dashboard-mask-art mask-${tone}`} aria-label={`View ${mask.name}'s profile`}>
        {mask.avatarUrl
          ? <><img className="mask-portrait-backdrop" src={mask.avatarUrl} alt="" aria-hidden="true" loading="lazy" /><img className="mask-portrait-image" src={mask.avatarUrl} alt={mask.name} loading="lazy" /></>
          : <span className="dashboard-mask-symbol">{mask.symbol || symbols[index % symbols.length]}</span>}
        <span className="dashboard-mask-ordinal">{String(index + 1).padStart(2, '0')}</span>
        <span className="dashboard-mask-arrow"><FaArrowRight /></span>
      </Link>
      <div className="dashboard-mask-body">
        <p className="dashboard-eyebrow">{years}</p>
        <div className="dashboard-mask-title-row">
          <h3><Link className="mask-card-profile-link" to={profilePath}>{mask.name}</Link></h3>
          {onToggleSaved && <button className="save-mask-button" onClick={() => onToggleSaved(mask)} aria-label={saved ? `Remove ${mask.name} from Your Twins` : `Save ${mask.name} to Your Twins`}>
            {saved ? <FaBookmark /> : <FaRegBookmark />}
          </button>}
        </div>
        {mask.profession && <p className="dashboard-mask-profession">{mask.profession}</p>}
        {chatTo && <Link className="mask-card-chat-link" to={chatTo} state={{ from: '/twins' }}>{mask.interviewCompleted ? 'Continue with your twin' : 'Get to know your twin'} <FaArrowRight /></Link>}
      </div>
    </article>
  )
}

export default MaskCard
