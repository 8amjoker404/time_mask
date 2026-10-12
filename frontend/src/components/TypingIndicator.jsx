function TypingIndicator({ name = 'The character', className = '' }) {
  return (
    <div className={`typing-indicator ${className}`.trim()} role="status" aria-label={`${name} is typing`}>
      <span className="typing-indicator-dots" aria-hidden="true"><i /><i /><i /></span>
      <span>{name} is typing</span>
    </div>
  )
}

export default TypingIndicator
