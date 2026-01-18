import { memo, useMemo, useState, useCallback } from 'react'
import { Message as MessageType } from '../../../interfaces'
import { formatMessageTime } from '../../../utils'
import { useToast } from '../../../contexts/ToastContext'
import './Message.css'

interface MessageProps {
  message: MessageType
  onRetry?: () => void
  showRetry?: boolean
}

const Message = memo(({ message, onRetry, showRetry = false }: MessageProps) => {
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()
  const isUserMessage = message.sender === 'user'
  const formattedTime = useMemo(
    () => formatMessageTime(message.timestamp),
    [message.timestamp]
  )

  // Ensure text is always a string (safety check)
  const messageText = typeof message.text === 'string' ? message.text : String(message.text || '')

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(messageText)
      setCopied(true)
      showToast('Message copied to clipboard', 'success', 2000)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
      showToast('Failed to copy message', 'error', 2000)
    }
  }, [messageText, showToast])

  const isError = showRetry && message.sender === 'bot' && messageText.includes('error')

  return (
    <div
      className={`message ${isUserMessage ? 'user-message' : 'bot-message'} ${isError ? 'message-error' : ''}`}
    >
      <div className="message-content">
        <p>{messageText}</p>
        <div className="message-footer">
          <span className="message-time">{formattedTime}</span>
          <div className="message-actions">
            {showRetry && isError && onRetry && (
              <button
                className="message-retry-button"
                onClick={onRetry}
                aria-label="Retry request"
                title="Retry request"
                type="button"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
                </svg>
                Retry
              </button>
            )}
            <button
              className="message-copy-button"
              onClick={handleCopy}
              aria-label={copied ? 'Copied!' : 'Copy message'}
              title={copied ? 'Copied!' : 'Copy message'}
              type="button"
            >
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

Message.displayName = 'Message'

export default Message
