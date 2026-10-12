import { FaArrowRight, FaBookmark, FaRegBookmark } from 'react-icons/fa6'
import { Link } from 'react-router-dom'

const tones = ['rose', 'olive', 'blue', 'sand']
const symbols = ['♕', '✳', '⌘', '◉']

function MaskCard({ mask, index = 0, saved = false, onToggleSaved }) {
  const tone = mask.tone || tones[index % tones.length]
  return (
    <article className="dashboard-mask-card">
      <Link to={`/chat/${mask.id}`} className={`dashboard-mask-art mask-${tone}`} aria-label={`Start a conversation with ${mask.name}`}>
        <span className="dashboard-mask-symbol">{mask.symbol || symbols[index % symbols.length]}</span>
        <span className="dashboard-mask-ordinal">{String(index + 1).padStart(2, '0')}</span>
        <span className="dashboard-mask-arrow"><FaArrowRight /></span>
      </Link>
      <div className="dashboard-mask-body">
        <p className="dashboard-eyebrow">{mask.era || 'A voice from history'}</p>
        <div className="dashboard-mask-title-row">
          <h3>{mask.name}</h3>
          {onToggleSaved && <button className="save-mask-button" onClick={() => onToggleSaved(mask)} aria-label={saved ? `Remove ${mask.name} from Your Twins` : `Save ${mask.name} to Your Twins`}>
            {saved ? <FaBookmark /> : <FaRegBookmark />}
          </button>}
        </div>
        <p>{mask.summary || 'Meet a new perspective from another time.'}</p>
      </div>
    </article>
  )
}

export default MaskCard
