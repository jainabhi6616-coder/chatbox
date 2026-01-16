import { memo, useCallback, useMemo } from 'react'
import './ChatInput.css'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  placeholder?: string
  disabled?: boolean
}

const ChatInput = memo(({
  value,
  onChange,
  onSend,
  placeholder = 'Type your message...',
  disabled = false,
}: ChatInputProps) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }, [onSend])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }, [onChange])

  const isSendDisabled = useMemo(
    () => disabled || value.trim() === '',
    [disabled, value]
  )

  return (
    <div className="chatbot-input-container">
      <input
        type="text"
        className="chatbot-input"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <button
        className="send-button"
        onClick={(e) => {
          e.preventDefault()
          onSend()
        }}
        disabled={isSendDisabled}
        aria-label="Send message"
        type="button"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
        </svg>
      </button>
    </div>
  )
})

ChatInput.displayName = 'ChatInput'

export default ChatInput

