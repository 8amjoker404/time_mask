import { useEffect, useRef, useState } from 'react'
import { FaCheck, FaTriangleExclamation, FaXmark } from 'react-icons/fa6'

let nextToastId = 0

function ToastHost() {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  useEffect(() => {
    const activeTimers = timers.current
    function addToast(event) {
      const message = event.detail?.message
      if (!message) return
      const id = ++nextToastId
      setToasts((current) => [...current.slice(-3), { id, message, type: event.detail.type || 'success' }])
      activeTimers.set(id, window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id))
        activeTimers.delete(id)
      }, 5000))
    }
    window.addEventListener('time-mask:toast', addToast)
    return () => {
      window.removeEventListener('time-mask:toast', addToast)
      activeTimers.forEach(window.clearTimeout)
      activeTimers.clear()
    }
  }, [])

  function dismiss(id) {
    window.clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }

  return (
    <div className="glass-toast-host" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => {
        const isError = toast.type === 'error'
        return <div className={`glass-toast ${isError ? 'is-error' : 'is-success'}`} role={isError ? 'alert' : 'status'} key={toast.id}>
          <span className="glass-toast-icon">{isError ? <FaTriangleExclamation /> : <FaCheck />}</span>
          <span className="glass-toast-message">{toast.message}</span>
          <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification"><FaXmark /></button>
        </div>
      })}
    </div>
  )
}

export default ToastHost
