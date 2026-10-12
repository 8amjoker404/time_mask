import { Link } from 'react-router-dom'
import './NotFound.css'

function NotFound() {
  return (
    <main className="not-found-page">
      <Link className="not-found-brand" to="/" aria-label="Time Mask home">
        <span className="not-found-brand-mark"><span /></span>
        <span>TIME <i>MASK</i></span>
      </Link>
      <section className="not-found-content">
        <p className="not-found-kicker">A MOMENT LOST IN TIME</p>
        <p className="not-found-number">404</p>
        <h1>This page belongs<br /><em>to another era.</em></h1>
        <p className="not-found-description">We couldn’t find the page you were looking for. The past is full of surprises; this one may have moved on.</p>
        <Link className="not-found-home" to="/">Return to Time Mask <span aria-hidden="true">→</span></Link>
      </section>
      <footer className="not-found-footer"><span>AN OPENING BETWEEN THEN AND NOW.</span><span>© TIME MASK 2025</span></footer>
    </main>
  )
}

export default NotFound
