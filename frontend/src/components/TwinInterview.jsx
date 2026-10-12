import { useState } from 'react'
import { FaArrowRight, FaPaperPlane } from 'react-icons/fa6'
import { apiError } from '../api/client'

const questions = [
  { id: 'preferred_name', prompt: 'What should I call you, and what would you like a new friend to know first?' },
  { id: 'personality', prompt: 'How would the people closest to you describe your personality?' },
  { id: 'interests', prompt: 'What do you love spending time on, or talking about?' },
  { id: 'memorable_moment', prompt: 'What is a moment you still remember clearly, and what made it meaningful to you?' },
  { id: 'support_style', prompt: 'When you have a difficult day, what kind of response feels helpful from a friend?' },
]

function TwinInterview({ mask, answers, onSave }) {
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const index = answers.length
  const current = questions[index]

  async function submit(event) {
    event.preventDefault()
    if (!current || !draft.trim() || busy) return
    const nextAnswers = [...answers, { questionId: current.id, answer: draft.trim() }]
    setBusy(true)
    setError('')
    try {
      await onSave(nextAnswers, nextAnswers.length === questions.length)
      setDraft('')
    } catch (err) {
      setError(apiError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="twin-interview" aria-labelledby="twin-interview-title">
      <header className="twin-interview-heading">
        <p className="dashboard-eyebrow">A FRIENDLY FIRST CONVERSATION</p>
        <h2 id="twin-interview-title">Let {mask.name.split(' ')[0]} get to know you.</h2>
        <p>Your twin will ask five short questions, then remember what you share for future conversations.</p>
      </header>
      <div className="twin-interview-progress" aria-label={`Question ${Math.min(index + 1, questions.length)} of ${questions.length}`}>
        <span style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>
      <p className="twin-interview-count">{index + 1} of {questions.length} questions</p>
      <div className="twin-interview-transcript" aria-live="polite">
        <div className="twin-interview-note"><span className="twin-interview-avatar">{mask.name.slice(0, 1)}</span><p>Before we begin, I’d love to know a little about the person I’m talking with. Share only what feels comfortable.</p></div>
        {answers.map((item) => {
          const prompt = questions.find((question) => question.id === item.questionId)?.prompt
          return <div key={item.questionId} className="twin-interview-pair"><div className="twin-interview-question"><small>{mask.name}</small><p>{prompt}</p></div><div className="twin-interview-answer"><small>You</small><p>{item.answer}</p></div></div>
        })}
        {current && <div className="twin-interview-question current"><small>{mask.name}</small><p>{current.prompt}</p></div>}
      </div>
      {current && <form className="twin-interview-composer" onSubmit={submit}>
        <label className="sr-only" htmlFor="twin-interview-answer">Your answer</label>
        <textarea id="twin-interview-answer" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={1800} rows={3} placeholder="Share whatever comes to mind…" disabled={busy} autoFocus />
        <button className="dashboard-primary-link" type="submit" disabled={!draft.trim() || busy}>{busy ? 'Saving…' : index === questions.length - 1 ? 'Meet your twin' : 'Continue'} {index === questions.length - 1 ? <FaArrowRight /> : <FaPaperPlane />}</button>
      </form>}
      {error && <p className="dashboard-error" role="alert">{error}</p>}
      <p className="twin-interview-privacy">Your answers are saved privately to your account and used to personalize this twin’s replies.</p>
    </section>
  )
}

export default TwinInterview
